/** @format */

import express from 'express';
import * as respuestas from '../../respuestas/respuestas';

import * as controlador from './cont-gestor';

const router = express.Router();

// Ruta para iniciar sesión
router.post("/validateLogin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { gestor, token } = await controlador.validateLogin(email, password);
    success(
      req,
      res,
      { 
        gestor,
        token,
        message: `Este es tu token de inicio de sesión: ${token}`,
      },
      200,
    );
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Ruta para registrar un usuario
router.post("/record", async (req, res) => {
  const { name, number, email, password } = req.body;
  try {
    const gestor = await controlador.record(name, number, email, password);
    success(req, res, gestor, 200);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Ruta para cambiar la contraseña
router.post('/changePassword', async (req, res) => { 
  const { email, password } = req.body; 
  try { 
    const gestor = await controlador.changePassword(email, password);
    success(req, res, gestor, 200); 
  } catch (error) { 
    console.error("Error durante el cambio de contraseña del gestor:", error.message); 
    res.status(400).json({ success: false, message: error.message });
  }
});

// Ruta para cerrar sesión
router.post("/logout", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res
      .status(400)
      .json({ success: false, message: "Token no proporcionado." });

  if (await controlador.isTokenBlacklisted(token)) {
    return res
      .status(400)
      .json({ success: false, message: "El token ya está en la lista negra." });
  }

  try {
    await controlador.logout(token);
    res.status(200).json({
      success: true,
      message: "Sesión cerrada correctamente. Tu token ahora es inválido.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
