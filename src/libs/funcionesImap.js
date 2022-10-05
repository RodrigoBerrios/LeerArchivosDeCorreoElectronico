const { getImap } = require('../config/imap');

const fs = require('fs');
const path = require('path');
const { Base64Decode } = require('base64-stream');
const Imap = require('imap');

const imap = getImap();

/**
 * Función que se encarga de abrir el box para leer los correos
 * @param {String} boxName - Nombre del box donde se va a buscar el correo
 */
const openBox = (boxName) => {
  imap.openBox(boxName, false, (err, box) => {
    /* console.log('*    Escuchando: ', boxName);
    console.log('*******************************'); */
  });
};

/**
 * Función que se encarga de obtener los correos nuevos
 */
const getNewsMessage = () => {
  console.log('*    Obteniendo nuevos mensajes');
  imap.search(['NEW'], (err, results) => {
    if (err) console.error(err);
    console.log('*    UID de los nuevos correos: ', results.join(', '));
    if (results.length > 0) {
      const f = imap.fetch(results, {
        bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
        struct: true,
      });
      f.on('message', function (msg, seqno) {
        console.log('*    Mensaje #%d', seqno);
        let prefix = '(#' + seqno + ') ';
        msg.on('body', function (stream, info) {
          var buffer = '';
          stream.on('data', function (chunk) {
            buffer += chunk.toString('utf8');
          });
          stream.once('end', function () {
            console.log(
              prefix + 'Header del correo: %s',
              JSON.stringify(Imap.parseHeader(buffer))
            );
          });
        });
        msg.once('attributes', function (attrs) {
          var attachments = findAttachmentParts(attrs.struct);
          console.log(
            prefix + 'Numero de archivos en el correo: %d',
            attachments.length
          );
          for (var i = 0, len = attachments.length; i < len; ++i) {
            var attachment = attachments[i];
            if (!validateAttachmentTypeFile(attachment.params.name, prefix)) continue;
            console.log(prefix + 'Cargando archivo %s', attachment.params.name);
            var f = imap.fetch(attrs.uid, {
              bodies: [attachment.partID],
              struct: true,
            });
            f.on('message', buildAttMessageFunction(attachment));
          }
        });
        msg.once('end', function () {
          console.log(prefix + 'Se finalizo la lectura del correo');
        });
      });
      f.once('error', function (err) {
        console.log('Fetch error: ' + err);
      });
      f.once('end', function () {});
      setMailsAsSeen(results);
    }
    console.log('*******************************');
  });
};

/**
 * Función que se encarga de marcar los correos como leidos
 * @param {Array} results - Lista de correos
 */
const setMailsAsSeen = (results) => {
  if (results.length > 0) {
    imap.setFlags(results, ['\\Seen'], (err) => {
      if (err) console.error(err);
    });
  }
};

/**
 * Función que se encarga de pasar a mayúsculas un string
 * @param {String} thing - String a pasar a mayúsculas
 * @returns {String} String en mayúsculas
 */

function toUpper(thing) {
  return thing && thing.toUpperCase ? thing.toUpperCase() : thing;
}

/**
 * Función que se encarga de obtener los archivos de los correos
 * @param {Object} struct - Objeto que contiene la estructura del correo
 * @param {Array} attachments - Lista de archivos adjuntos
 * @returns {Array} Lista de archivos adjuntos
 */

function findAttachmentParts(struct, attachments) {
  attachments = attachments || [];
  for (var i = 0, len = struct.length, r; i < len; ++i) {
    if (Array.isArray(struct[i])) {
      findAttachmentParts(struct[i], attachments);
    } else {
      if (
        struct[i].disposition &&
        ['INLINE', 'ATTACHMENT'].indexOf(toUpper(struct[i].disposition.type)) >
          -1
      ) {
        attachments.push(struct[i]);
      }
    }
  }
  return attachments;
}

/**
 * Función que se encarga de construir la función que se encarga de guardar los archivos
 * @param {Object} attachment - Objeto que contiene el archivo
 * @returns {Function} Función que se encarga de guardar el archivo
 */
function buildAttMessageFunction(attachment) {
  var filename = attachment.params.name;
  var encoding = attachment.encoding;

  return function (msg, seqno) {
    var prefix = '(#' + seqno + ') ';
    msg.on('body', function (stream, info) {
      console.log(prefix + 'Guardando archivo', filename, info);
      var writeStream = fs.createWriteStream(filename);
      writeStream.on('finish', function () {
        console.log(prefix + 'Archivo guardado %s', filename);
      });
      if (toUpper(encoding) === 'BASE64') {
        stream.pipe(new Base64Decode()).pipe(writeStream);
      } else {
        stream.pipe(writeStream);
      }
    });
    msg.once('end', function () {
      console.log(prefix + 'Se finalizo la carga de archivos %s', filename);
    });
  };
}

/**
 * Función para validar el tipo de archivo
 * @param {String} filename - Nombre del archivo
 * @param {String} prefix - Prefijo para mostrar en consola
 * @returns {Boolean} Si el archivo es válido o no
 */

const validateAttachmentTypeFile = (filename, prefix) => {
  const validTypes = ['xml'];
  const type = path.extname(filename).replace('.', '');
  const isValid = validTypes.includes(type);
  if (!isValid) console.log(prefix + 'Archivo no valido: %s', filename);
  return isValid
};

module.exports = {
  openBox,
  getNewsMessage,
};
