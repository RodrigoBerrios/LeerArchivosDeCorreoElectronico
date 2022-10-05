// crea la conexion imap

const config = require('./index');

const Imap = require('imap');

let imap;

/**
 * Crea la conexion imap
 */
const crearConexion = () => {
  imap = new Imap({
    user: config.imap.user,
    password: config.imap.password,
    host: config.imap.host,
    port: config.imap.port,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });
};

/**
 * Conecta a la cuenta de correo
 */

const conectar = () => {
  console.log('*******************************')
  console.log('*    Conectando a IMAP');
  console.log('*******************************')
  if (!imap) {
    crearConexion();
  }
  imap.connect();
};

/**
 * Desconecta de la cuenta de correo
 */

const desconectar = () => {
  console.log('*******************************')
  console.log('*    Desconectando de IMAP');
  console.log('*******************************')
  if (imap) {
    imap.end();
    imap = null;
  }
};

/**
 * Obtiene la conexion imap
 * @returns {Imap}
 */

const getImap = () => {
  if (!imap) {
    conectar();
  }
  return imap;
};

module.exports = {
  conectar,
  desconectar,
  getImap,
};
