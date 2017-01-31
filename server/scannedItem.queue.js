const Queue = require('bull');

module.exports = function createVirusScanningQueue(app, redisHost, redisPort) {
  const logger = app.get('logger');
  const ScanResult = app.models.ScanResult;
  const FileModel = app.models.File;
  const connectString = `redis://${redisHost}:${redisPort}`;

  function createScanResultPromise(instance) {
    return new Promise((resolve, reject) => {
      ScanResult.create(instance, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    });
  }

  const scannedItemQueue = Queue('scanned_item', connectString, {});
  scannedItemQueue.process(function (job, done) {
    logger.info('Processing scanned item');
    const {detects, filename, detectTypes} = job.data;

    if (detects > 0) {
      FileModel.find({where: {name: filename}}, (err, res) => {
        if (err) {
          return done(err);
        }

        Promise.all(detectTypes.map(type => {
          const instance = {
            av: type,
            filename,
            created: Date.now(),
            detect: type,
            FileScan: res[0].id
          };

          return createScanResultPromise(instance);
        })).then(() => {
          done();
        }).catch(error => {
          done(error);
        });
      });
    }
    else {
      done();
    }
  });

  scannedItemQueue.on('error', function(error) {
    logger.error('Got error in processing scanned item', error);
  });

  return scannedItemQueue;
};
