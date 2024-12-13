/** @format */

const { getConexion } = require("./conexion");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

async function validateLogin(email, password) {
  return new Promise((resolve, reject) => {
    const conexion = getConexion();
    conexion.query(
      "SELECT * FROM gestor WHERE correo_ges = ?",
      [email],
      async (error, result) => {
        if (error) return reject(new Error("Error al verificar el correo."));
        if (result.length === 0)
          return reject(new Error("Correo no encontrado."));

        const gestor = result[0];
        const match = await bcrypt.compare(password, gestor.contra_ges);
        if (!match) return reject(new Error("Contraseña incorrecta."));

        resolve(gestor);
      },
    );
  });
}

async function record(name, number, email, password) {
  return new Promise(async (resolve, reject) => {
    const conexion = getConexion();
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const [result] = await conexion
        .promise()
        .query("SELECT correo_ges FROM gestor WHERE correo_ges = ?", [email]);
      if (result.length > 0) return reject(new Error("El correo ya existe."));

      const [result2] = await conexion
        .promise()
        .query("SELECT num_ges FROM gestor WHERE num_ges = ?", [number]);
      if (result2.length > 0) return reject(new Error("El número ya existe."));

      const [result3] = await conexion
        .promise()
        .query(
          "SELECT CONCAT('G', LPAD(IFNULL(SUBSTRING(MAX(cod_ges), 2) + 1, 1), 2, '0')) AS new_cod_ges FROM gestor;",
        );
      const newCodGes = result3[0].new_cod_ges;

      await conexion
        .promise()
        .query(
          "INSERT INTO gestor (cod_ges, nom_ges, num_ges, correo_ges, contra_ges) VALUES (?, ?, ?, ?, ?)",
          [newCodGes, name, number, email, hashedPassword],
        );

      resolve({ newCodGes, name, email });
    } catch (error) {
      reject(new Error("Error al registrar el gestor: " + error.message));
    }
  });
}


//Funcion de cambio de contraseña
function changePassword(email, password) {
  return new Promise((resolve, reject) => {
    const conexion = getConexion();

    conexion.query("SELECT correo_ges FROM gestor WHERE correo_ges = ?", [email], (error, result) => {
      if (error) {
        console.error("Error al verificar el correo:", error);
        return reject(new Error("Error al verificar el correo"));
      }

      if (result.length === 0) {
        return reject(new Error("El correo no existe"));
      }

      conexion.query("UPDATE gestor SET contra_ges = ? WHERE correo_ges = ?", [password, email], (error2, result2) => {
        if (error2) {
          console.error("Error al actualizar la contraseña:", error2);
          return reject(new Error("Error al actualizar la contraseña"));
        }


        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'tonyqp2@gmail.com',
            pass: 'uciz ccbo xdnb ydid'
          }
        });

        const mailOptions = {
          from: 'tonyqp2@gmail.com',
          to: email,
          subject: 'Cambio de Contraseña',
          text: `Su nueva contraseña es: ${password}`
        };

        transporter.sendMail(mailOptions, (error3, info) => {
          if (error3) {
            console.error("Error al enviar el correo:", error3);
            return reject(new Error(`Error al enviar el correo`));
          }

          console.log("Correo enviado:", info.response);
          resolve({ success: true, message: "Contraseña cambiada y correo enviado" });
        });
      });
    });
  })}
//Funcion de cambio de contraseña nueva version 
async function changePassword(email, newPassword) {
  return new Promise(async (resolve, reject) => {
    const conexion = getConexion();

    try {
      // Verificar si el correo existe
      const [result] = await conexion
        .promise()
        .query("SELECT correo_ges FROM gestor WHERE correo_ges = ?", [email]);

      if (result.length === 0) {
        return reject(new Error("El correo no existe"));
      }

      // Encriptar la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar la contraseña en la base de datos
      await conexion
        .promise()
        .query("UPDATE gestor SET contra_ges = ? WHERE correo_ges = ?", [
          hashedPassword,
          email,
        ]);

      // Configuración del correo electrónico
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Cambio de Contraseña",
        text: `Su nueva contraseña es: ${newPassword}`,
      };

      // Enviar el correo
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error al enviar el correo:", error);
          return reject(
            new Error(`Error al enviar el correo: ${error.message}`),
          );
        }

        console.log("Correo enviado:", info.response);
        resolve({
          success: true,
          message: "Contraseña cambiada y correo enviado",
        });
      });
    } catch (error) {
      reject(new Error("Error al cambiar la contraseña: " + error.message));
    }

  });
}

/*function changePassword(email, password) {
  return new Promise((resolve, reject) => {
    const conexion = getConexion();

    conexion.query(
      "SELECT correo_ges FROM gestor WHERE correo_ges = ?",
      [email],
      (error, result) => {
        if (error) {
          console.error("Error al verificar el correo:", error);
          return reject(new Error("Error al verificar el correo"));
        }

        if (result.length === 0) {
          return reject(new Error("El correo no existe"));
        }

        conexion.query(
          "UPDATE gestor SET contra_ges = ? WHERE correo_ges = ?",
          [password, email],
          (error2, result2) => {
            if (error2) {
              console.error("Error al actualizar la contraseña:", error2);
              return reject(new Error("Error al actualizar la contraseña"));
            }

            const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
              },
            });

            const mailOptions = {
              from: "tonyqp2@gmail.com",
              to: email,
              subject: "Cambio de Contraseña",
              text: `Su nueva contraseña es: ${password}`,
            };

            transporter.sendMail(mailOptions, (error3, info) => {
              if (error3) {
                console.error("Error al enviar el correo:", error3);
                return reject(new Error(`Error al enviar el correo`));
              }

              console.log("Correo enviado:", info.response);
              resolve({
                success: true,
                message: "Contraseña cambiada y correo enviado",
              });
            });
          },
        );
      },
    );
  });
}*/

module.exports = {
  validateLogin,
  record,
  changePassword
}
  