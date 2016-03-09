'use strict';

var Queue = require('bull');
var sharp = require('sharp');
var request = require('request');
var tmp = require('tmp');
var fs = require('fs');

module.exports = function imageQueueCreator(app, redisHost, redisPort) {
  var logger = app.get('logger');
  var imageQueue = Queue('image transcoding', redisPort, redisHost);
  imageQueue.process(function(job, done) {
    logger.info('starting new image transcoding job', job.data);
    var extension = job.data.fileObj.url.split('.');
    extension = extension[extension.length - 1];
    var width;
    var height;
    switch (job.data.size) {
      case 'large':
        width = 1024;
        break;
      case 'medium':
        width = 512;
        break;
      case 'small':
        width = 200;
        break;
      case 'large-square':
        width = 1024;
        height = 1024;
        break;
      case 'medium-square':
        width = 512;
        height = 512;
        break;
      case 'small-square':
        width = 200;
        height = 200;
        break;
      case 'thumbnail':
        width = 50;
        height = 50;
        break;
      default:
        width = 200;
        break;
    }

    var tmpobj = tmp.fileSync({mode: '0666', prefix: 's3-image-', postfix: '.' + extension});
    request(app.get('url') + job.data.fileObj.url).pipe(fs.createWriteStream(null, {fd: tmpobj.fd})).on('close', function() {
      logger.info('got imagefile', {name: tmpobj.name});
      let imageObject = sharp(tmpobj.name).png();

      if (width && height) {
        imageObject.resize(width, height).withoutEnlargement();
      }
      else {
        imageObject.resize(width).max().withoutEnlargement();
      }

      imageObject.toBuffer()
        .then(function (outputBuffer) {
          tmpobj.removeCallback();
          app.models.ImageCollection.createResolution(
            outputBuffer,
            job.data.bucket,
            job.data.fileObj,
            job.data.size,
            job.data.imageCollection,
            () => {
              logger.info('finished image transcoding job', job.data);
              done();
            }
          );
        })
        .catch(function (err) {
          logger.error('an error occurred while transcoding image', {job: job.data, error: err});
          done();
        });
    });
  });

  return imageQueue;
};
