const { getImap, conectar } = require('../config/imap');
const { openBox, getNewsMessage } = require('./funcionesImap');
const moment = require('moment-timezone');

const imap = getImap();
const boxName = 'INBOX';

// Eventos que emite IMAP

/**
 * Evento que se dispara cuando se conecta al servidor IMAP
 */

imap.once('ready', () => {
  console.log('*    Conectado');
  openBox(boxName);
});

/**
 * Evento que se dispara cuando llega un nuevo mensaje
 */
imap.on('mail', (mailNumber) => {
  console.log('*******************************');
  console.log('*    Nuevos correos:', mailNumber);
  console.log('*    Fecha:', moment().tz('America/Lima').format('DD/MM/YYYY HH:mm:ss'));
  getNewsMessage();
});

/**
 * Evento que se dispara cuando ocurre un error
 */
imap.once('error', (err) => {
  console.error('*    Ocurrio un error', err);
  console.log('*    Volviendo a conectar');
  conectar();
});

/**
 * Evento que se dispara cuando se desconecta del servidor IMAP
 */

imap.once('end', () => {
  console.log('*    Conexión cerrada');
  console.log('*    Volviendo a conectar');
  conectar();
});
