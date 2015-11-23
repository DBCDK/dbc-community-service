'use strict';

import loopback from 'loopback';
import boot from 'loopback-boot';
import Logger from 'dbc-node-logger';

const app = loopback();
const APP_NAME = process.env.APPLICATION_NAME || 'app_name'; // eslint-disable-line no-process-env
const logger = new Logger({app_name: APP_NAME});
export default app;

import bodyParser from 'body-parser';

app.use(bodyParser.json({limit: '50mb'}));

app.start = () => {
  // start the web server
  return app.listen(() => {
    app.emit('started');
    logger.debug(`Web server listening at :: ${app.get('url')}`); // eslint-disable-line no-console
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
    logger.error('An error occured while booting up the ProfileService', {error: err});
    throw err;
  }

  app.start();
});
