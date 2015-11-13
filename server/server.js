'use strict';

import loopback from 'loopback';
import boot from 'loopback-boot';

const app = loopback();
export default app;

import bodyParser from 'body-parser';

app.use(bodyParser.json({limit: '50mb'}));

app.start = () => {
  // start the web server
  return app.listen(() => {
    app.emit('started');
    console.log('Web server listening at : %s', app.get('url')); // eslint-disable-line no-console
  });
};

app.use('/status-page', (req, res, next) => { // eslint-disable-line no-unused-vars
  res.send('status');
});

app.use('/email_confirm', (req, res) => {
  res.send('{}');
});

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, (err) => {
  if (err) {
    throw err;
  }

  app.start();
});
