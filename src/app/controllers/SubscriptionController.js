import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import Queue from '../../lib/Queue';
import SubscriptionMail from '../jobs/SubscriptionMail';
import User from '../models/User';

class SubscriptionController {
  async store(req, res) {
    const { meetup_id } = req.body;

    const meetup = await Meetup.findByPk(meetup_id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['name', 'email'],
        },
      ],
    });

    const user = await User.findByPk(req.userId);

    if (meetup.user_id === user.id) {
      return res
        .status(400)
        .json({ error: 'You can not subscribe to your own meetups' });
    }

    if (meetup.past) {
      return res.status(400).json({ error: 'Pasts meetup are not permitted' });
    }

    const checkSubscriptionInTheSameDate = await Subscription.findOne({
      where: {
        user_id: user.id,
      },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkSubscriptionInTheSameDate) {
      return res.status(400).json({
        error: 'You can not subscribe to two meetups at the same time',
      });
    }

    const subscription = await Subscription.create({
      user_id: user.id,
      meetup_id,
    });

    await Queue.add(SubscriptionMail.key, {
      meetup,
      user,
    });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
