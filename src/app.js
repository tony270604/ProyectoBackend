const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const comida = require('./modules/comida/comida');
const gestor = require('./modules/gestor/gestor');
const boleta = require('./modules/boleta/boleta');
const port=process.env.PORT || 5001


mysql://root:cBDGoRqJOGdNslOnOyroUUmJxCiIYyiD@junction.proxy.rlwy.net:30627/railway
app = express();

// Configura CORS 
app.use(cors({
    origin: 'https://proyectoprofe.netlify.app', 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
//Para que maneje objetos 
app.use(morgan('dev'));
app.use(express.json());

app.set('port',config.app.port);

app.use('/api/comida', comida);
app.use('/api/gestor', gestor);
app.use('/api/boleta', boleta);


module.exports=app;
