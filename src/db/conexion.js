const mysql = require('mysql2');
const config = require('../config');

const DBconfig = {
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    port: config.mysql.mysqlport
};

let conexion;

function conMysql() {
    conexion = mysql.createConnection(DBconfig);
    conexion.connect((error) => {
        if (error) {
            console.error("DB ERROR CONEXION:", error); 
        } else {
            console.log("DB conectado");
        }
    });
}

conMysql();

function getConexion() {
    return conexion;
}

module.exports = {
    getConexion,
};
