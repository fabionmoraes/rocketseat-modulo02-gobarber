import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notifications';
import Mail from '../../lib/Mail';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query; // Paginação

    const appointments = await Appointment.findAll({
      where: {
        user_id: req.userID,
        canceled_at: null,
      },
      attributes: ['id', 'data'],
      order: ['data'],
      limit: 20, // Limite de paginação com offset
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: {
            model: File,
            as: 'avatar',
            attributes: ['path', 'url'],
          },
        },
      ],
    });

    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      data: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Campos Obrigatórios' });
    }

    const { provider_id, data } = req.body;

    /**
     * Checa se o provider é servidor de provider
     */
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(400)
        .json({ error: 'O Provider selecionado não tem permissão' });
    }

    // Check se o usuário conectado vai criar provider pra ele mesmo

    if (isProvider.id === req.userID) {
      return res.status(400).json({
        error: 'não é permitido para criar provider para você mesmo.',
      });
    }

    // Verifica se a data é atual
    const hourStart = startOfHour(parseISO(data));

    if (isBefore(hourStart, new Date())) {
      return res.status(401).json({ error: 'Sua data não é permitida.' });
    }

    // Verifica se o horário já tem agendamento

    const checkVerifica = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        data: hourStart,
      },
    });

    if (checkVerifica) {
      return res.status(400).json({ error: 'Esse horário não está vago.' });
    }

    const appointment = await Appointment.create({
      user_id: req.userID,
      provider_id,
      data,
    });

    /**
     * Notificar o prestador de serviço
     */

    const user = await User.findByPk(req.userID);
    const formatarData = format(hourStart, "'dia' dd 'de' MMMM', às' H:mm'h'", {
      locale: pt,
    });

    await Notification.create({
      content: `Novo agendamento de ${user.name} no ${formatarData}`,
      user: provider_id,
    });

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (appointment.user_id !== req.userID) {
      return res.status(401).json({ error: 'Você não é permitido cancelar' });
    }

    const HoraMenos = await subHours(appointment.data, 2);

    if (isBefore(HoraMenos, new Date())) {
      return res
        .status(401)
        .json({ error: 'Seu limite para cancelamento é de menos de 2h.' });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    // Envio de email
    await Mail.sendMail({
      to: `${appointment.provider.name} <${appointment.provider.email}>`,
      subject: 'Agendamento cancelado',
      template: 'cancelado',
      context: {
        provider: appointment.provider.name,
        user: appointment.user.name,
        data: format(appointment.data, "'dia' dd 'de' MMMM', às' H:mm'h'", {
          locale: pt,
        }),
      },
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
