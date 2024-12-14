const express = require("express");
const controlador = require("./cont-boleta");
const respuesta = require("../../respuestas/respuestas");
const { generarReportePDF } = require('../../db/boletaDAO');
const router = express.Router();

router.post("/registrarPedido", async function (req, res) {
  const {
    dni_cli,
    nom_cli,
    correo_cli,
    hora,
    fec_bol,
    metodo_pago,
    cod_ges,
    detalles,
  } = req.body;

  if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Detalles del pedido son obligatorios",
    });
  }

  try {
    const boletaRegistrada = await controlador.registrarPedido(
      { dni_cli, nom_cli, correo_cli, hora, fec_bol, cod_ges, metodo_pago },
      detalles
    );
    return res.status(200).json({
      success: true,
      message: "Pedido registrado y boleta enviada correctamente",
      data: { boleta: boletaRegistrada },
    });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.put("/inhabilitarBoleta/:numBol", async function (req, res) {
  const { numBol } = req.params;

  try {
    const result = await controlador.inhabilitarBoleta(numBol);
    respuesta.success(req, res, result, 200);
  } catch (error) {
    console.error("Error al inhabilitar la boleta:", error.message);
    respuesta.error(req, res, error.message, 400);
  }
});

router.get("/listarBoletas", async function (req, res) {
  try {
    const boletas = await controlador.listarBoletas();
    
    // Validar que boletas sea un array
    if (!Array.isArray(boletas)) {
      return res.status(500).json({ success: false, message: "El resultado no es un array" });
    }

    respuesta.success(req, res, boletas, 200);
  } catch (error) {
    console.error("Error al listar las boletas:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/generarReportePDF", generarReportePDF);


module.exports = router;
