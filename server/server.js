// #20: quickfix for removing warnings in console output.
require('events').EventEmitter.prototype._maxListeners = 20;

let config;
let generateSignedCloudfrontCookie;
try {
  config = require('@dbcdk/biblo-config');
  generateSignedCloudfrontCookie = config.generateSignedCloudfrontCookie;
  config = config.config;
}
catch (err) {
  console.error('Cannot find config module, falling back to default config.'); // eslint-disable-line no-console
  console.error('Cloudfront is unavailable! Cannot use virus scanner!'); // eslint-disable-line no-console
  config = require('config');
  generateSignedCloudfrontCookie = () => '';
}

import loopback from 'loopback';
import boot from 'loopback-boot';
import Logger from 'dbc-node-logger';
import countMixin from 'loopback-counts-mixin';
import AWS from 'aws-sdk';
import ProxyAgent from 'proxy-agent';
import {amazonSNSConfirmMiddleware, amazonSNSNotificationMiddleware} from './middlewares/amazonSNS.middleware';
import groupDatasourceModifier from './connectorlogic/group.datasourcemodifier';
import Primus from 'primus';
import {getDSDefs} from './ds';
import {setupMailbox} from './email-client';

const app = loopback();
const logger = new Logger({app_name: config.get('CommunityService.applicationTitle')});
export default app;

import bodyParser from 'body-parser';

const amazonConfig = config.get('ServiceProvider.aws');
app.set('amazonConfig', amazonConfig);
app.set('logger', logger);

// Configure AWS globally.
AWS.config.update({
  region: amazonConfig.region,
  accessKeyId: amazonConfig.keyId,
  secretAccessKey: amazonConfig.key
});

if (config.get('Proxy.http_proxy')) {
  AWS.config.update({
    httpOptions: {
      agent: ProxyAgent(config.get('Proxy.http_proxy'))
    }
  });
}

const redisConfig = {
  port: config.get('Redis.port'),
  host: config.get('Redis.host')
};

// Create fileContainer model, and point it to amazon.
app.model(loopback.createDataSource({
  connector: require('loopback-component-storage'),
  provider: 'amazon',
  key: amazonConfig.key,
  keyId: amazonConfig.keyId,
  maxFileSize: '52428800' // 50 mb limit on images.
}).createModel('fileContainer'));

// Add Counts Mixin to loopback
countMixin(app);

app.use(bodyParser.text({type: 'text/*'}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(amazonSNSConfirmMiddleware.bind(null, amazonConfig));
app.use(amazonSNSNotificationMiddleware.bind(null, amazonConfig));

app.startQueues = () => {
  if (!process.env.DISABLE_IMAGE_SCALING_QUEUE) {
    // Using require to make the dependencies optional.
    app.set('imageQueue', require('./image.queue')(app, redisConfig.host, redisConfig.port));
    app.set('virusQueue', require('./virus.queue')(app, redisConfig.host, redisConfig.port, config));
    app.set('scannedItemQueue', require('./scannedItem.queue')(app, redisConfig.host, redisConfig.port, config));
  }
  else {
    app.set('imageQueue', {
      add: () => {} // if the imageQueue is disabled, we simply supress created jobs.
    });

    app.set('virusQueue', {
      add: () => {}
    });

    app.set('scannedItemQueue', {
      add: () => {}
    });
  }

  setupMailbox(app, config);
};

app.start = () => {
  // start the web server
  return app.listen(config.get('CommunityService.port'), () => {
    app.emit('started');
    logger.debug(`Running: ${config.util.getEnv('NODE_ENV')}-${config.util.getEnv('NODE_APP_INSTANCE')} from ${config.util.getEnv('CONFIG_DIR')}`);
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
        logger.info(`Got change, model: ${key}`);
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
boot(app, {
  appRootDir: __dirname,
  dataSources: getDSDefs()
}, (err) => {
  if (err) {
    logger.error('An error occured while booting up the Community Service', {error: err});
    throw err;
  }

  groupDatasourceModifier(app);

  if (!process.env.TESTING && !process.env.MIGRATING) {
    const webserver = app.start();
    app.startPrimus(webserver);
    app.startQueues();
  }
});
