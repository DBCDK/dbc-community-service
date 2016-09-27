'use strict';

require('babel-core/register');

Promise.all(require('./server/ds').getDS()).then(() => {
  require('./server/server');
}).catch((err) => {
  console.error(err);
});
