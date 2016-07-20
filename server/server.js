'use strict';

import loopback from 'loopback';
import boot from 'loopback-boot';
import Logger from 'dbc-node-logger';
import countMixin from 'loopback-counts-mixin';
import AWS from 'aws-sdk';
import ProxyAgent from 'proxy-agent';
import {amazonSNSConfirmMiddleware, amazonSNSNotificationMiddleware} from './middlewares/amazonSNS.middleware';
import groupDatasourceModifier from './connectorlogic/group.datasourcemodifier';
import Primus from 'primus';

const app = loopback();
const APP_NAME = process.env.APPLICATION_NAME || 'app_name';
const logger = new Logger({app_name: APP_NAME});
export default app;

import bodyParser from 'body-parser';

let amazonConfig;

if (process.env.AMAZON_S3_KEY && process.env.AMAZON_S3_KEYID) {
  amazonConfig = {
    key: process.env.AMAZON_S3_KEY,
    keyId: process.env.AMAZON_S3_KEYID
  };
}
else if (require('@dbcdk/biblo-config').communityservice.amazon) {
  amazonConfig = require('@dbcdk/biblo-config').communityservice.amazon;
}
else {
  amazonConfig = {
    key: '',
    keyId: ''
  };
}

app.set('amazonConfig', amazonConfig);
app.set('logger', logger);

// Configure AWS globally.
AWS.config.update({
  region: amazonConfig.region,
  accessKeyId: amazonConfig.keyId,
  secretAccessKey: amazonConfig.key
});

if (process.env.http_proxy) {
  AWS.config.update({
    httpOptions: {
      agent: ProxyAgent(process.env.http_proxy)
    }
  });
}

// Add Counts Mixin to loopback
countMixin(app);

let redisConfig;

if (process.env.COMMUNITY_SERVICE_REDIS_HOST && process.env.COMMUNITY_SERVICE_REDIS_PORT) {
  redisConfig = {
    port: process.env.COMMUNITY_SERVICE_REDIS_PORT,
    host: process.env.COMMUNITY_SERVICE_REDIS_HOST
  };
}
else if (require('@dbcdk/biblo-config').communityservice.redis) {
  redisConfig = require('@dbcdk/biblo-config').communityservice.redis;
}
else {
  redisConfig = {
    port: 6379,
    host: '127.0.0.1'
  };
}

// Create fileContainer model, and point it to amazon.
app.model(loopback.createDataSource({
  connector: require('loopback-component-storage'),
  provider: 'amazon',
  key: amazonConfig.key,
  keyId: amazonConfig.keyId,
  maxFileSize: '52428800' // 50 mb limit on images.
}).createModel('fileContainer'));

app.use(bodyParser.text({type: 'text/*'}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(amazonSNSConfirmMiddleware.bind(null, amazonConfig));
app.use(amazonSNSNotificationMiddleware.bind(null, amazonConfig));

if (!process.env.DISABLE_IMAGE_SCALING_QUEUE) {
  // Using require to make the dependencies optional.
  app.set('imageQueue', require('./image.queue')(app, redisConfig.host, redisConfig.port));
}
else {
  app.set('imageQueue', {
    add: () => {} // if the imageQueue is disabled, we simply supress created jobs.
  });
}

app.start = () => {
  // start the web server
  return app.listen(() => {
    app.emit('started');
    logger.debug(`Web server listening at :: ${app.get('url')}`); // eslint-disable-line no-console
  });
};

/**
 * This function boots up Primus.
 * Primus accepts connections and emits a change event whenever one of the user defined models are changed.
 * @param {HttpServer} webserver
 */
app.startPrimus = webserver => {
  const primus = new Primus(webserver, {
    transformer: 'websockets'
  });

  const listeners = {};
  const defaultModels = ['User', 'AccessToken', 'ACL', 'RoleMapping', 'Role', 'Email'];
  const modelKeys = Object.keys(app.models).filter(key => defaultModels.indexOf(key) < 0);
  modelKeys.forEach(key => {
    const lowKey = key.toLowerCase();
    if (!listeners[lowKey]) {
      const model = app.models[key];
      model.observe('after save', (ctx, next) => {
        if (ctx.instance) {
          primus.write({
            event: `${lowKey}Changed`,
            data: ctx.instance,
            isNewInstance: ctx.isNewInstance
          });
        }

        next();
      });

      listeners[lowKey] = 1;
    }
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
    logger.error('An error occured while booting up the Community Service', {error: err});
    throw err;
  }

  groupDatasourceModifier(app);

  if (!process.env.TESTING && !process.env.MIGRATING) {
    const webserver = app.start();
    app.startPrimus(webserver);
  }
});
