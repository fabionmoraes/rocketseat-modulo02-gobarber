import Notification from '../schemas/Notifications';
import User from '../models/User';

class NotificationController {
  async index(req, res) {
    const checkisProvider = await User.findOne({
      where: { id: req.userID, provider: true },
    });

    if (!checkisProvider) {
      return res
        .status(400)
        .json({ error: 'Você não é um provider para notificação' });
    }

    const notifications = await Notification.find({
      user: req.userID,
    })
      .sort({ createdAt: 'desc' })
      .limit(20);

    return res.json(notifications);
  }

  async update(req, res) {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    return res.json(notification);
  }
}

export default new NotificationController();
