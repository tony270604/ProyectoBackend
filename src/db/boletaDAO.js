//Importar la funcion conexcion
const { getConexion } = require("./conexion");
const nodemailer = require("nodemailer");
const fs = require("fs");
const PDFDocument = require("pdfkit");

//listar boletas
const listarBoletas = (estado) => {
  return new Promise((resolve, reject) => {
    const conexion = getConexion();
    let query = `
      SELECT 
          b.num_bol, b.dni_cli, b.nom_cli, b.correo_cli, b.total, b.fec_bol, b.hora, b.estado, b.metodo_pago,
          GROUP_CONCAT(CONCAT(c.nom_com, ' (x', d.cantidad, ') - ', c.precio_com) SEPARATOR ', ') AS detalles
      FROM 
          boleta b
      LEFT JOIN 
          detalle d ON b.num_bol = d.num_bol
      LEFT JOIN 
          comida c ON d.cod_com = c.cod_com
    `;

    if (estado) {
      query += ` WHERE b.estado = ?`;
    }

    query += ` GROUP BY b.num_bol ORDER BY b.fec_bol DESC, b.hora DESC;`;

    conexion.query(query, [estado], (error, results) => {
      if (error) {
        console.error("Error al listar las boletas:", error);
        reject(new Error("Error al listar las boletas"));
        return;
      }

      // Asegúrate de devolver un array vacío en caso de que no haya resultados
      resolve(results.length > 0 ? results : []);
    });
  });
};

//registrar un nuevo pedido
const registrarPedido = (pedido, detalles) => {
  return new Promise((resolve, reject) => {
    const conexion = getConexion();
    conexion.query("SELECT COUNT(*) AS count FROM boleta", (error, result) => {
      if (error) {
        console.error("Error al obtener el count de boleta:", error);
        return reject(new Error("Error al obtener el count de boleta"));
      }
      const count = result[0].count;
      let newCodCom;

      if (count === 0) {
        newCodCom = "B001";
        realizarInsercion(pedido, detalles, newCodCom, resolve, reject);
      } else {
        conexion.query(
          "SELECT CONCAT('B', LPAD(SUBSTRING(MAX(num_bol), 2) + 1, 3, '0')) AS new_cod_com FROM boleta",
          (error3, result3) => {
            if (error3) {
              console.error("Error al obtener el nuevo num_bol:", error3);
              return reject(new Error("Error al obtener el nuevo num_bol"));
            }
            newCodCom = result3[0].new_cod_com;
            realizarInsercion(pedido, detalles, newCodCom, resolve, reject);
          }
        );
      }
    });
  });
};

const realizarInsercion = (pedido, detalles, newCodCom, resolve, reject) => {
  const conexion = getConexion();
  pedido.num_bol = newCodCom;

  const queryBoleta = `INSERT INTO boleta (num_bol, dni_cli, nom_cli, correo_cli, hora, fec_bol, cod_ges, metodo_pago, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`;

  const paramsBoleta = [
    pedido.num_bol,
    pedido.dni_cli,
    pedido.nom_cli,
    pedido.correo_cli,
    pedido.hora,
    pedido.fec_bol,
    pedido.cod_ges,
    pedido.metodo_pago,
    0, // Inicializar total en 0
  ];

  conexion.query(queryBoleta, paramsBoleta, async (error) => {
    if (error) {
      console.error("Error al registrar el pedido:", error);
      return reject(new Error("Error al registrar el pedido"));
    }

    const queryDetalle = `INSERT INTO detalle (num_bol, cod_com, cantidad, comentario)
            VALUES (?, ?, ?, ?);`;

    const detallePromises = detalles.map((detalle) => {
      const paramsDetalle = [
        pedido.num_bol,
        detalle.cod_com,
        detalle.cantidad,
        detalle.comentario || null,
      ];
      return new Promise((resolve, reject) => {
        conexion.query(queryDetalle, paramsDetalle, (error) => {
          if (error) {
            console.error("Error al registrar detalle:", error);
            return reject(new Error("Error al registrar detalle"));
          }
          resolve();
        });
      });
    });

    try {
      await Promise.all(detallePromises);
      const totalActualizado = await actualizarTotalBoleta(pedido.num_bol); // Asegúrate de que esta función devuelva una promesa
      console.log("Pedido registrado con éxito:", pedido.num_bol);
      console.log(
        "Total actualizado correctamente para la boleta:",
        totalActualizado
      );
      await enviarBoleta(pedido.correo_cli, pedido.num_bol); // Asegúrate de que el total ya esté actualizado
      console.log("Correo enviado para la boleta:", pedido.num_bol);
      resolve({ num_bol: pedido.num_bol });
    } catch (error) {
      console.error("Error al registrar los detalles:", error);
      reject(new Error("Error al registrar los detalles"));
    }
  });
};

const inhabilitarBoleta = (num_bol) => {
  return new Promise((resolve, reject) => {
    const conexion = getConexion();
    const query = `
        UPDATE boleta
        SET estado = 'inhabilitado'
        WHERE num_bol = ?;
      `;

    conexion.query(query, [num_bol], (error, result) => {
      if (error) {
        console.error("Error al inhabilitar la boleta:", error);
        return reject(new Error("Error al inhabilitar la boleta"));
      }

      if (result.affectedRows === 0) {
        return reject(new Error("No se encontró la boleta para inhabilitar"));
      }

      resolve({ message: "Boleta inhabilitada con éxito" });
    });
  });
};

const actualizarTotalBoleta = (num_bol) => {
  return new Promise((resolve, reject) => {
    const conexion = getConexion();
    conexion.query(
      `SELECT SUM(d.cantidad * c.precio_com) AS total
             FROM detalle d
             JOIN comida c ON d.cod_com = c.cod_com
             WHERE d.num_bol = ?`,
      [num_bol],
      (error, rows) => {
        if (error) {
          console.error(
            `Error al consultar el total de la boleta ${num_bol}:`,
            error
          );
          return reject(error);
        }

        const nuevoTotal = rows[0]?.total || 0;

        conexion.query(
          `UPDATE boleta SET total = ? WHERE num_bol = ?`,
          [nuevoTotal, num_bol],
          (updateError) => {
            if (updateError) {
              console.error(
                `Error al actualizar el total de la boleta ${num_bol}:`,
                updateError
              );
              return reject(updateError);
            } else {
              console.log(
                `Total actualizado para la boleta ${num_bol}: ${nuevoTotal}`
              );
              resolve(nuevoTotal); // Resolvemos la promesa con el nuevo total
            }
          }
        );
      }
    );
  });
};

//enviar al correo la boleta
function enviarBoleta(correo_cli, num_bol) {
  return new Promise(async (resolve, reject) => {
    try {
      const conexion = getConexion();
      console.log("Obteniendo datos de la boleta:", num_bol);

      const [boleta] = await conexion.promise().query(
        `SELECT b.num_bol, b.nom_cli, b.total, b.metodo_pago, b.estado, d.cod_com, d.cantidad, c.nom_com, c.precio_com
                  FROM boleta b
                  LEFT JOIN detalle d ON b.num_bol = d.num_bol
                  LEFT JOIN comida c ON d.cod_com = c.cod_com
                  WHERE b.num_bol = ?`,
        [num_bol]
      );

      if (!boleta || boleta.length === 0) {
        console.error("No se encontraron datos para la boleta:", num_bol);
        return reject(new Error("No se encontró la boleta"));
      }

      console.log("Datos de la boleta obtenidos:", boleta);

      const detallesBoleta = boleta
        .map(
          (detalle) =>
            `${detalle.nom_com} - Cantidad: ${detalle.cantidad} - Precio Unitario: S/.${detalle.precio_com}`
        )
        .join("\n");

      const boletaInfo = boleta[0];
      const cuerpoCorreo = `
              Estimado(a) ${boletaInfo.nom_cli},
  
              Gracias por su compra. A continuación, le detallamos los datos de su boleta:
  
              Número de Boleta: ${boletaInfo.num_bol}
              Total: S/.${boletaInfo.total}
              Método de Pago: ${boletaInfo.metodo_pago || "No especificado"}
              Estado: ${boletaInfo.estado}
  
              Detalles de los productos:
              ${detallesBoleta}
  
              Gracias por preferirnos.
          `;

      console.log("Preparando para enviar correo a:", correo_cli);

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: correo_cli,
        subject: `Boleta N° ${boletaInfo.num_bol}`,
        text: cuerpoCorreo,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error al enviar el correo:", error);
          return reject(
            new Error(`Error al enviar el correo: ${error.message}`)
          );
        }

        console.log("Correo enviado exitosamente:", info.response);
        resolve({
          success: true,
          message: "Boleta enviada al correo del cliente",
        });
      });
    } catch (error) {
      console.error("Error al enviar la boleta:", error.message);
      reject(new Error(`Error al enviar la boleta: ${error.message}`));
    }
  });
}

//listar boletas para el pdf
const listarBoletasPDF = (estado) => {
  return new Promise((resolve, reject) => {
    const conexion = getConexion();
    let query = `
              SELECT 
                  b.num_bol, b.dni_cli, b.nom_cli, b.correo_cli, b.total, b.fec_bol, b.hora, b.estado, b.metodo_pago,
                  d.cod_com, c.nom_com, d.cantidad, c.precio_com
              FROM 
                  boleta b
              LEFT JOIN 
                  detalle d ON b.num_bol = d.num_bol
              LEFT JOIN 
                  comida c ON d.cod_com = c.cod_com
          `;

    if (estado) {
      query += ` WHERE b.estado = ?`;
    }

    query += ` ORDER BY b.fec_bol DESC, b.hora DESC;`;

    conexion.query(query, [estado], (error, results) => {
      if (error) {
        console.error("Error al listar las boletas:", error);
        reject(new Error("Error al listar las boletas"));
        return;
      }

      const boletas = {};
      results.forEach((row) => {
        if (!boletas[row.num_bol]) {
          boletas[row.num_bol] = {
            num_bol: row.num_bol,
            dni_cli: row.dni_cli,
            nom_cli: row.nom_cli,
            correo_cli: row.correo_cli,
            total: row.total,
            fec_bol: row.fec_bol,
            hora: row.hora,
            estado: row.estado,
            metodo_pago: row.metodo_pago,
            detalles: [],
          };
        }
        if (row.cod_com) {
          boletas[row.num_bol].detalles.push({
            cod_com: row.cod_com,
            nom_com: row.nom_com,
            cantidad: row.cantidad,
            precio: row.precio_com,
          });
        }
      });

      resolve(Object.values(boletas));
    });
  });
};

const generarReportePDF = async (req, res) => {
  try {
    const boletas = await listarBoletasPDF(); // Asegúrate de que esta función esté bien definida

    const doc = new PDFDocument({ layout: 'landscape' });
    const buffers = [];

    // Captura el PDF en un buffer
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte_ventas.pdf');
      res.send(pdfData);
    });

    doc.fontSize(20).text('Reporte de Boletas', { align: 'center' });

    // Cabecera de la tabla
    doc.fontSize(11).text('Número de Boleta', 30, 100);
    doc.text('Cliente', 130, 100);
    doc.text('Total', 230, 100);
    doc.text('Método de Pago', 330, 100);
    doc.text('Estado', 430, 100);
    doc.text('Fecha', 550, 100);
    doc.text('Hora', 650, 100);

    // Línea horizontal de encabezado
    doc.moveTo(30, 110)
       .lineTo(730, 110)
       .stroke();

    boletas.forEach((boleta, index) => {
      const y = 120 + index * 20;

      const fecha = new Date(boleta.fec_bol);
      const fechaFormateada = fecha.toDateString(); 

      doc.fontSize(10).text(boleta.num_bol, 30, y);
      doc.text(boleta.nom_cli, 130, y);
      doc.text(`S/.${boleta.total}`, 230, y);
      doc.text(boleta.metodo_pago, 330, y);
      doc.text(boleta.estado, 430, y);
      doc.text(fechaFormateada, 550, y);
      doc.text(boleta.hora, 650, y);


      // Línea horizontal para la fila actual
      doc.moveTo(30, y + 10)
         .lineTo(730, y + 10)
         .stroke();

      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error('Error al generar el reporte PDF:', error);
    res.status(500).json({ success: false, message: 'Error al generar el reporte PDF' });
  }
};


module.exports = {
  registrarPedido,
  inhabilitarBoleta,
  listarBoletas,
  enviarBoleta,
  generarReportePDF,
  
  
};
