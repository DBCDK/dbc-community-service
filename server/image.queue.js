const Queue = require('bull');
const gm = require('gm');

import AWS from 'aws-sdk';

function getSizeFromJob(size) {
  let width;
  let height;
  switch (size) {
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

  return {width, height};
}

function getExtensionFromJob(fileObj) {
  let extension = fileObj.url.split('.');
  extension = extension[extension.length - 1].toUpperCase();
  extension = extension === 'GIF' ? extension : 'PNG';

  return extension;
}

function getS3ReadStream(job, logger) {
  let s3ReadStream;

  try {
    s3ReadStream = (new AWS.S3())
      .getObject({
        Bucket: job.data.fileObj.container,
        Key: job.data.fileObj.name
      })
      .createReadStream();
  }
  catch (error) {
    logger.error('Error in getting image from s3', {error});
    return null;
  }

  return s3ReadStream;
}

function doImageProcessing(s3ReadStream, job, width, height, extension, logger) {
  return new Promise((resolve, reject) => {
    let imageObject;
    try {
      imageObject = gm(s3ReadStream)
        .autoOrient()
        .noProfile();

      job.progress(40);

      if (width && height) {
        // We need to resize to a square image.
        // So we need to the smallest dimension first, then crop to a square image.
        imageObject.size({bufferStream: true}, (err, size) => {
          job.progress(45);

          let rWidth = null;
          let rHeight = null;

          if (size.width > size.height) {
            rHeight = height;
          }
          else {
            rWidth = width;
          }

          imageObject.gravity('Center').resize(rWidth, rHeight).crop(width, height);
          job.progress(60);
          resolve(imageObject);
        });
      }
      else {
        // We only want to size by the width
        imageObject.resize(width);
        job.progress(60);
        resolve(imageObject);
      }
    }
    catch (e) {
      const errStr = 'Error in image processing';
      logger.error(errStr, {error: e});
      return reject(errStr);
    }
  });
}

module.exports = function imageQueueCreator(app, redisHost, redisPort) {
  const logger = app.get('logger');
  const connectString = `redis://${redisHost}:${redisPort}`;

  const imageQueue = Queue('image transcoding', connectString, {});
  imageQueue.process(function (job, done) {
    logger.info('starting new image transcoding job', job.data);
    const extension = getExtensionFromJob(job.data.fileObj);
    const height = getSizeFromJob(job.data.size).height;
    const width = getSizeFromJob(job.data.size).width;
    job.progress(10);

    const s3ReadStream = getS3ReadStream(job, logger);
    if (!s3ReadStream) {
      return done('Error in getting image from s3');
    }

    job.progress(20);
    const imagePromise = doImageProcessing(s3ReadStream, job, width, height, extension, logger);
    return imagePromise.then(imageObject => {
      if (!imageObject) {
        return done('Could not do image processing!');
      }

      imageObject.toBuffer(extension, function (err, buffer) {
        if (err) {
          logger.error('Error in transcoding', {error: err});
          return done(err);
        }

        job.progress(80);

        return app.models.ImageCollection.createResolution(
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
  });

  return imageQueue;
};
