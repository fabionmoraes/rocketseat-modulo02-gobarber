import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';

import User from '../models/User';
import Appointment from '../models/Appointment';

class AgendaController {
  async index(req, res) {
    const checkUserProvider = await User.findOne({
      where: { id: req.userID, provider: true },
    });

    if (!checkUserProvider) {
      return res.status(401).json({ error: 'Usuário não é um provider' });
    }

    const { data } = req.query;
    const parseData = parseISO(data);

    const appointments = await Appointment.findAll({
      where: {
        provider_id: req.userID,
        canceled_at: null,
        data: {
          [Op.between]: [startOfDay(parseData), endOfDay(parseData)],
        },
      },
      order: ['data'],
    });

    return res.json(appointments);
  }
}

export default new AgendaController();
