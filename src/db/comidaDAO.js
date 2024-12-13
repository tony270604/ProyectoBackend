/** @format */

//Importar la funcion conexcion
const { getConexion } = require("./conexion");

// const listarComida = (nom_com) => {
//   return new Promise((resolve, reject) => {
//     const conexion = getConexion();

//     // Construir la consulta SQL según el filtro
//     const sql = nom_com
//       ? `SELECT * FROM comida WHERE nom_com LIKE ?`
//       : `SELECT * FROM comida`;

//     const params = nom_com ? [`%${nom_com}%`] : [];

//     conexion.query(sql, params, (error, result) => {
//       if (error) {
//         return reject(new Error("Error en la consulta a la base de datos."));
//       }
//       // Procesar campos binarios (BLOB) solo si están presentes
//       const processedResult = result.map((comida) => {
//         if (comida.img1_com) {
//           comida.img1_com = `data:image/png;base64,${comida.img1_com.toString(
//             "base64",
//           )}`;
//         }
//         return comida;
//       });
//       resolve(processedResult);
//     });
//   });
// };

// Función para registrar una nueva comida
const listarComida = (nom_com, categoria) => {
  return new Promise((resolve, reject) => {
    const conexion = getConexion();

    // Consulta base para obtener todos los datos de la tabla comida
    const sqlBase = `
      SELECT comida.cod_com, comida.nom_com, comida.des_com, comida.precio_com, comida.img1_com, categoria.nom_cat
      FROM comida
      LEFT JOIN cate_comida ON comida.cod_com = cate_comida.cod_com
      LEFT JOIN categoria ON cate_comida.cod_cat = categoria.cod_cat
    `;

    // Consulta para obtener resultados con filtros
    let sqlFiltro = sqlBase;
    const params = [];

    // Aplicar filtros si están definidos
    if (nom_com) {
      sqlFiltro += ` WHERE comida.nom_com LIKE ?`;
      params.push(`%${nom_com}%`);
    }

    if (categoria) {
      sqlFiltro += params.length > 0 ? ` AND` : ` WHERE`;
      sqlFiltro += ` (categoria.nom_cat LIKE ? OR categoria.nom_cat IS NULL)`;
      params.push(`%${categoria}%`);
    }

    // Ejecutar ambas consultas
    Promise.all([
      new Promise((res, rej) => {
        conexion.query(sqlBase, [], (error, result) => {
          if (error) return rej(new Error("Error en la consulta base."));
          res(result);
        });
      }),
      new Promise((res, rej) => {
        conexion.query(sqlFiltro, params, (error, result) => {
          if (error) return rej(new Error("Error en la consulta filtrada."));
          res(result);
        });
      }),
    ])
      .then(([baseResult, filterResult]) => {
        // Procesar campos binarios (BLOB) si están presentes
        const processImages = (comidas) =>
          comidas.map((comida) => {
            if (comida.img1_com) {
              comida.img1_com = `data:image/png;base64,${comida.img1_com.toString(
                "base64"
              )}`;
            }
            return comida;
          });

        const allComidas = processImages(baseResult);
        const filteredComidas = processImages(filterResult);

        // Combinar resultados: añadir los filtrados al inicio y el resto después
        const combined = [...filteredComidas, ...allComidas].filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.cod_com === item.cod_com)
        );

        resolve(combined);
      })
      .catch((error) => reject(error));
  });
};


function addFood(name, price, des, imgBuffer) {
  return new Promise((resolve, reject) => {
    const conexion = getConexion();
    conexion.query(
      "SELECT CONCAT('C', LPAD(SUBSTRING(MAX(cod_com), 2) + 1, 3, '0')) AS new_cod_com FROM comida",
      (error3, result3) => {
        if (error3) {
          console.error("Error al obtener el nuevo cod_com:", error3);
          return reject(new Error("Error al obtener el nuevo cod_com"));
        }
        const newCodCom = result3[0].new_cod_com;

        conexion.query(
          "INSERT INTO comida (cod_com, nom_com, des_com, precio_com, img1_com) VALUES (?, ?, ?, ?, ?)",
          [newCodCom, name, des, price, imgBuffer],
          (error4, result4) => {
            if (error4) {
              console.error("Error al insertar la comida:", error4);
              return reject(new Error("Error al insertar la comida"));
            }
            console.log("Comida registrada con éxito:", newCodCom);
            resolve({ newCodCom, name, des, price });
          },
        );
      },
    );
  });
}

//Funcion para editar una comida
function editFood(cod_com, name, price, des, imgBuffer) {
  return new Promise((resolve, reject) => {
    const conexion = getConexion();
    // Verificar si el cod_com existe
    conexion.query(
      "SELECT cod_com FROM comida WHERE cod_com = ?",
      [cod_com],
      (error, result) => {
        if (error) {
          console.error("Error al verificar el cod_com:", error);
          return reject(new Error("Error al verificar el cod_com"));
        }
        if (result.length === 0) {
          return reject(new Error("El cod_com no existe"));
        }

        const query = `
        UPDATE Comida
        SET 
          nom_com = COALESCE(NULLIF(?, ''), nom_com),
          des_com = COALESCE(NULLIF(?, ''), des_com),
          precio_com = COALESCE(NULLIF(?, ''), precio_com),
          img1_com = COALESCE(NULLIF(?, ''), img1_com)
        WHERE cod_com = ?;
      `;

        conexion.query(
          query,
          [name, des, price, imgBuffer, cod_com],
          (error4, result4) => {
            if (error4) {
              console.error("Error al editar la comida:", error4);
              return reject(new Error("Error al editar la comida"));
            }
            console.log("Comida editada con éxito:", cod_com);
            resolve({ cod_com, name, des, price });
          },
        );
      },
    );
  });
}

//Funcion para eliminar una Comida
function deleteFood(cod_com) {
  return new Promise((resolve, reject) => {
    const conexion = getConexion();
    // Verificar si el cod_com existe
    conexion.query(
      "SELECT cod_com FROM comida WHERE cod_com = ?",
      [cod_com],
      (error, result) => {
        if (error) {
          console.error("Error al verificar el cod_com:", error);
          return reject(new Error("Error al verificar el cod_com"));
        }
        if (result.length === 0) {
          return reject(new Error("El cod_com no existe"));
        }
        conexion.query(
          "delete from Comida where cod_com=?",
          [cod_com],
          (error4, result4) => {
            if (error4) {
              console.error("Error al eliminar la comida:", error4);
              return reject(new Error("Error al eliminar la comida"));
            }
            console.log("Comida eliminada con éxito:", cod_com);
            resolve({ cod_com });
          },
        );
      },
    );
  });
}
module.exports = {
  listarComida,
  addFood,
  editFood,
  deleteFood,
};
