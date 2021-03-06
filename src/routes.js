import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';
import AppointmentController from './app/controllers/AppointmentController';
import AgendaController from './app/controllers/AgendaController';
import NotificationController from './app/controllers/NotificationController';
import DisponivelController from './app/controllers/DisponivelController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware); // Abaixo Somente com autenticação

routes.put('/users', UserController.update);

routes.get('/providers', ProviderController.index);
routes.get('/providers/:providerID/disponivel', DisponivelController.index);

routes.post('/appointments', AppointmentController.store);
routes.get('/appointments', AppointmentController.index);
routes.delete('/appointments/:id', AppointmentController.delete);
routes.get('/agendamentos', AgendaController.index);
routes.get('/notifications', NotificationController.index);
routes.put('/notifications/:id', NotificationController.update);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;
