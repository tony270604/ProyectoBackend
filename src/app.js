import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config.js'; 
import comida from './modules/comida/comida.js';
import gestor from './modules/gestor/gestor.js';
import boleta from './modules/boleta/boleta.js';

const port = process.env.PORT || 5001;

const app = express();

app.use(cors({
    origin: 'http://localhost:4200', 
    credentials: true 
}));

app.use(morgan('dev'));
app.use(express.json());

app.set('port', config.app.port);

app.use('/api/comida', comida);
app.use('/api/gestor', gestor);
app.use('/api/boleta', boleta);

export default app;
