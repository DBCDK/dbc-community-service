'use strict';

var Queue = require('bull');
var gm = require('gm');

import AWS from 'aws-sdk';

module.exports = function imageQueueCreator(app, redisHost, redisPort) {
  var logger = app.get('logger');
  var imageQueue = Queue('image transcoding', redisPort, redisHost);
  imageQueue.process(function (job, done) {
    logger.info('starting new image transcoding job', job.data);
    var extension = job.data.fileObj.url.split('.');
    extension = extension[extension.length - 1].toUpperCase();
    extension = extension === 'GIF' ? extension : 'PNG';

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

    job.progress(10);

    let s3ReadStream;

    try {
      s3ReadStream = (new AWS.S3())
        .getObject({
          Bucket: job.data.fileObj.container,
          Key: job.data.fileObj.name
        })
        .createReadStream();
    }
    catch (e) {
      logger.error('Error in getting image from s3', {error: e});
      return done(e);
    }

    job.progress(20);
    let imageObject;

    try {
      imageObject = gm(s3ReadStream)
        .autoOrient()
        .noProfile();

      job.progress(40);

      if (extension !== 'GIF') {
        if (width && height) {
          imageObject = imageObject.resizeExact(width, height);
        }
        else {
          imageObject = imageObject.resize(width);
        }
      }

      job.progress(60);
    }
    catch (e) {
      logger.error('Error in getting image from s3', {error: e});
      return done(e);
    }

    imageObject.toBuffer(extension, function (err, buffer) {
      if (err) {
        logger.error('Error in transcoding', {error: err});
        return done(err);
      }

      job.progress(80);

      app.models.ImageCollection.createResolution(
        buffer,
        job.data.bucket,
        job.data.fileObj,
        job.data.size,
        job.data.imageCollection,
        () => {
          job.progress(100);

          done(null, {
            size: width && height ? `${width}x${height}` : `${width}x${width}`
          });

          logger.info('finished image transcoding job', {
            size: width && height ? `${width}x${height}` : `${width}x${width}`,
            data: job.data
          });
        }
      );
    });
  });

  return imageQueue;
};
