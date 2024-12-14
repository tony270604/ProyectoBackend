/** @format */

import express from 'express';
import * as controlador from './cont-comida.js';
import * as respuesta from '../../respuestas/respuestas.js';
import multer from 'multer';

const router = express.Router();
const upload = multer();

// router.get("/listarcomida", async function (req, res) {
//   const { nom_com } = req.query; // Captura el parámetro de consulta
//   try {
//     const items = await controlador.listarComida(nom_com); // Pasa el parámetro al controlador
//     res.status(200).json(items);
//   } catch (error) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// });
router.get("/listarcomida", async function (req, res) {
  const { nom_com, categoria } = req.query; // Captura los parámetros de consulta
  try {
    const items = await controlador.listarComida(nom_com, categoria); // Pasa ambos parámetros al controlador
    res.status(200).json(items);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/addFood", upload.single("img"), async function (req, res) {
  const { name, price, des } = req.body;
  const img = req.file; // Esto contiene la información del archivo

  if (!img) {
    return res.status(400).json({
      success: false,
      message: "No se proporcionó una imagen válida.",
    });
  }

  try {
    const comida = await controlador.addFood(name, price, des, img.buffer); // Pasar el buffer del archivo
    respuesta.success(req, res, comida, 200);
  } catch (error) {
    console.error("Error al insertar la comida:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/editFood", upload.single("img"), async function (req, res) {
  const { cod_com, name, price, des } = req.body;
  const img = req.file;

  // Si la imagen no es proporcionada, pasar 'null' o 'undefined' para que no la actualice
  const imgBuffer = img ? img.buffer : null;

  try {
    const comida = await controlador.editFood(
      cod_com,
      name,
      price,
      des,
      imgBuffer,
    );
    respuesta.success(req, res, comida, 200);
  } catch (error) {
    console.error("Error al editar la comida:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/deleteFood", async function (req, res) {
  const { cod_com } = req.body;
  try {
    const comida = await controlador.deleteFood(cod_com);
    respuesta.success(req, res, comida, 200);
  } catch (error) {
    console.error("Error al eliminar la comida:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
