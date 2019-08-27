import {
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  format,
  isAfter,
} from 'date-fns';
import { Op } from 'sequelize';
import Appointment from '../models/Appointment';

class DisponivelController {
  async index(req, res) {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Data inválida' });
    }

    const pesquisaData = Number(date);

    const agendamentos = await Appointment.findAll({
      where: {
        provider_id: req.params.providerID,
        canceled_at: null,
        data: {
          [Op.between]: [startOfDay(pesquisaData), endOfDay(pesquisaData)],
        },
      },
    });

    const schedule = [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
    ];

    const disponivel = schedule.map(time => {
      const [hour, min] = time.split(':');
      const value = setSeconds(
        setMinutes(setHours(pesquisaData, hour), min),
        0
      );

      return {
        time,
        value: format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        disponivel:
          isAfter(value, new Date()) &&
          !agendamentos.find(a => format(a.data, 'HH:mm') === time),
      };
    });

    return res.json(disponivel);
  }
}

export default new DisponivelController();
