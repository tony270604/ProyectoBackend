/** @format */
//jwt para los tokens
const jwt = require("jsonwebtoken");
const DB = require("../../db/gestorDAO");

// se usa la variable de entorno JWT_SECRET
const TOKEN_SECRET = process.env.JWT_SECRET;

// para desactivar el token se sesion con esto se apaga
const blacklistedTokens = new Set();

// se genera un token la sesion solo va ha durar 1h si se desea se modifica
function generateToken(id) {
  return jwt.sign({ id }, TOKEN_SECRET, { expiresIn: "1h" });
}

// Validacion el inicio de sesión y genera el token
async function validateLogin(email, password) {
  const gestor = await DB.validateLogin(email, password);
  const token = generateToken(gestor.cod_ges);
  return { gestor, token };
}

// Registra un nuevo usuarios zzzzz
function record(name, number, email, password) {
  return DB.record(name, number, email, password);
}

function changePassword(email, password){
  return DB.changePassword(email, password);
}

// Cierra sesión agregando el token a la lista negra
function logout(token) {
  blacklistedTokens.add(token);
  return Promise.resolve({ message: "Sesión cerrada correctamente." });
}

// Verifica si un token está en la lista negra
function isTokenBlacklisted(token) {
  return blacklistedTokens.has(token);
}

module.exports = {
  validateLogin,
  record,
  logout,
  isTokenBlacklisted,
  changePassword,
};
