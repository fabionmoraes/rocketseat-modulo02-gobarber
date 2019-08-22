import { Router } from 'express';
import User from './app/models/User';

const routes = new Router();

routes.get('/', async (req, res) => {
  const user = await User.create({
    name: 'Fabio Moraes',
    email: 'fabio@elaboredigital.com.br',
    password_hash: '312312312312',
  });

  return res.json(user);
});

export default routes;
