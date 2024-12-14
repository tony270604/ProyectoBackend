// Importación de módulos
import * as DB from '../../db/boletaDAO.js';

function registrarPedido(pedido, detalles) {
  return DB.registrarPedido(pedido, detalles);
}

function inhabilitarBoleta(num_bol) {
  return DB.inhabilitarBoleta(num_bol);
}

function listarBoletas() {
  return DB.listarBoletas()
      .then(results => {
          if (Array.isArray(results) && results.length > 0) {
              return results;
          } else {
              return []; // Devolver un array vacío si los resultados son inválidos
          }
      })
      .catch(error => {
          console.error("Error al listar las boletas:", error);
          throw new Error("Error al listar las boletas");
      });
}

function enviarBoleta(correo_cli, numBol) {
    return DB.enviarBoleta(correo_cli, numBol);
}

function generarReportePDF() {
    return DB.generarReportePDF();
}

export {
  registrarPedido,
  inhabilitarBoleta,
  listarBoletas,
  enviarBoleta,
  generarReportePDF,
};
