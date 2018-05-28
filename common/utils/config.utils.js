let config;
try {
  config = require('@dbcdk/biblo-config').config;
} catch (err) {
  config = require('config');
}

export default config;
