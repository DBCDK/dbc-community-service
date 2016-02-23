'use strict';

var Queue = require('bull');
var sharp = require('sharp');
var request = require('request');
var tmp = require('tmp');
var fs = require('fs');

module.exports = function imageQueueCreator(app, redisHost, redisPort) {
  var imageQueue = Queue('image transcoding', redisPort, redisHost);
  imageQueue.process(function(job, done) {
    var extension = job.data.fileObj.url.split('.');
    extension = extension[extension.length - 1];
    var width;
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
      default:
        width = 200;
        break;
    }

    var tmpobj = tmp.fileSync({mode: '0666', prefix: 's3-image-', postfix: '.' + extension});
    request(app.get('url') + job.data.fileObj.url).pipe(fs.createWriteStream(null, {fd: tmpobj.fd})).on('close', function() {
      try {
        sharp(tmpobj.name)
          .resize(width)
          .max()
          .toBuffer()
          .then(function (outputBuffer) {
            tmpobj.removeCallback();
            app.models.ImageCollection.createResolution(
              outputBuffer,
              job.data.bucket,
              job.data.fileObj,
              job.data.size,
              job.data.imageCollection,
              () => done()
            );
          });
      }
      catch (e) {
        done();
      }
    });
  });

  return imageQueue;
};
