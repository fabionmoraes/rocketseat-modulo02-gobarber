import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore } from 'date-fns';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';

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
        .json({ error: 'Você não é permitido para criar provider.' });
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

    return res.json(appointment);
  }
}

export default new AppointmentController();
