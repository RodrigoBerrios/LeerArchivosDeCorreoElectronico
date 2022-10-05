// data de configuración
const config = {
  imap: {
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASSWORD,
    host: process.env.IMAP_HOST,
    port: process.env.IMAP_PORT,
  },
};

// validacion de variables de entorno

if (!config.imap.user) {
  throw new Error('IMAP_USER is not defined');
}

if (!config.imap.password) {
  throw new Error('IMAP_PASSWORD is not defined');
}

if (!config.imap.host) {
  throw new Error('IMAP_HOST is not defined');
}

if (!config.imap.port) {
  throw new Error('IMAP_PORT is not defined');
}

module.exports = config;
