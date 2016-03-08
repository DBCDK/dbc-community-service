'use strict';

const CONTAINERS_URL = 'api/fileContainers/';

module.exports = function(VideoCollection) { // eslint-disable-line no-unused-vars
  VideoCollection.createResolution = function createVideoResolution(videoCollectionId, message, cb) {
    const logger = VideoCollection.app.get('logger');

    message.outputs.forEach((videoOutput) => {
      VideoCollection.app.models.resolution.create({
        size: `${videoOutput.width}x${videoOutput.height}`,
        videoCollectionResolutionId: videoCollectionId
      }, function (err, resolutionObject) {
        if (err) {
          return cb(err);
        }

        if (resolutionObject && resolutionObject.id) {
          VideoCollection.app.models.file.create({
            container: message.userMetadata.destinationContainer,
            name: videoOutput.key,
            type: message.userMetadata.mimetype,
            url: CONTAINERS_URL + encodeURIComponent(message.userMetadata.destinationContainer) + '/download/' + encodeURIComponent(videoOutput.key),
            resolutionVideoFileId: resolutionObject.id
          }, function (err2, info) {
            if (err2) {
              cb(err2);
            }
            else {
              logger.info('conversion job completed!', info);
              cb(null, info);
            }
          });
        }
      });
    });
  };

  VideoCollection.newVideoCollection = function newVideoCollection(data, next) {
    VideoCollection.create({}, function (error1, newVideoCollectionObject) {
      if (error1) {
        next(error1);
      }
      else {
        VideoCollection.app.models.resolution.create({
          size: 'original_video',
          videoCollectionResolutionId: newVideoCollectionObject.id
        }, function (error2, newResolutionObject) {
          if (error2) {
            next(error2);
          }
          else {
            VideoCollection.app.models.file.create({
              container: data.container,
              name: data.videofile,
              type: data.mimetype,
              url: CONTAINERS_URL + encodeURIComponent(data.container) + '/download/' + encodeURIComponent(data.videofile),
              resolutionVideoFileId: newResolutionObject.id
            }, function (error3) {
              if (error3) {
                next(error3);
              }
              else {
                next(null, newVideoCollectionObject);
              }
            });
          }
        });
      }
    });
  };

  VideoCollection.observe('before delete', function(ctx, next) {
    VideoCollection.find({where: ctx.where, include: ['resolutions']}, (err, instances) => {
      instances = Array.isArray(instances) ? instances : [instances];
      instances.forEach((instance) => {
        (instance.resolutions && Array.isArray(instance.resolutions) ? instance.resolutions : []).forEach((resolution) => {
          resolution.destroy();
        });
      });
    });

    next();
  });
};
