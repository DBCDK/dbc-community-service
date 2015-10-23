'use strict';

var loopback = require('loopback');
require('babel/register');
var boot = require('loopback-boot');

var app = module.exports = loopback();

var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    console.log('Web server listening at : %s', app.get('url')); // eslint-disable-line no-console
  });
};

app.use('/status-page', function(req, res, next) { // eslint-disable-line no-unused-vars
  res.send('status');
});

app.use('/email_confirm', function(req, res) {
  res.send('{}');
});

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) {
    throw err;
  }

  // start the server if `$ node server.js`
  if (require.main === module) {
    app.start();
  }
});
