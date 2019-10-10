import * as Yup from 'yup';
import { isBefore, parseISO } from 'date-fns';

import Meetup from '../models/Meetup';

class MeetupController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      file_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { title, description, location, date, file_id } = req.body;

    if (isBefore(parseISO(date), new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const meetup = await Meetup.create({
      title,
      description,
      location,
      date,
      file_id,
      user_id: req.userId,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number().required(),
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      file_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id, title, description, location, date, file_id } = req.body;

    const meetup = await Meetup.findByPk(id);

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({
        error: 'You do not have permission to update this meetup',
      });
    }

    if (meetup.past) {
      return res.status(401).json({
        error: 'You do can not update past meetups',
      });
    }

    if (isBefore(parseISO(date), new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    await meetup.update({
      title,
      description,
      location,
      date,
      file_id,
    });

    return res.json(meetup);
  }

  async delete(req, res) {
    const { meetupId } = req.params;

    const meetup = await Meetup.findByPk(meetupId);

    if (!meetup) {
      return res.status(401).json({
        error: 'This meetup does not exist',
      });
    }

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({
        error: 'You do not have permission to cancel this meetup',
      });
    }

    if (isBefore(meetup.date, new Date())) {
      return res.status(401).json({
        error: 'You can not delete a past meetup',
      });
    }

    await meetup.destroy();

    return res.json(meetup);
  }
}

export default new MeetupController();
