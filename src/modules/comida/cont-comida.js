/** @format */

import * as DB from '../../db/comidaDAO';  // Importación por nombramiento

// function listarComida(nom_com) {
//   return DB.listarComida(nom_com);
// }
function listarComida(nom_com, categoria) {
  return DB.listarComida(nom_com, categoria); // Pasa los parámetros al modelo
}

function addFood(name, price, des, img) {
  return DB.addFood(name, price, des, img);
}

function editFood(cod_com, name, price, des, imgBuffer) {
  return DB.editFood(cod_com, name, price, des, imgBuffer);
}

function deleteFood(cod_com) {
  return DB.deleteFood(cod_com);
}

export {
  listarComida,
  addFood,
  editFood,
  deleteFood,
};
