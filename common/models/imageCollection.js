

/**
 * @file: imageCollection.js - Contains custom logic for imageCollections.
 * @param ImageCollection - Model class.
 */

module.exports = function(ImageCollection) {
  let fileModel;
  let resolutionModel;
  let amazonBuckets;
  let buckets;
  let imageQueue;

  const imageQueueConfig = {
    attempts: 5,
    timeout: 300000 // 5 minutes.
  };

  // Wait till the app is initialized.
  setTimeout(() => {
    fileModel = ImageCollection.app.models.file;
    resolutionModel = ImageCollection.app.models.resolution;
    imageQueue = ImageCollection.app.get('imageQueue');
    amazonBuckets = ImageCollection.app.get('amazonConfig').buckets.imageBuckets;
    buckets = Object.keys(amazonBuckets).map((bucketSize) => {
      return {bucket: amazonBuckets[bucketSize], size: bucketSize};
    });
  });

  ImageCollection.createResolution = (fileBuffer, container, fileObj, size, imageCollectionObject, cb) => {
    let fileName = fileObj.name.split('.');
    const extension = fileName[fileName.length - 1];
    fileName.pop();
    fileName = fileName.join('.') + '_' + size + '.' + extension;
    fileModel.uploadFromBuffer(container, fileName, fileBuffer, fileObj.type, (err1, fileObject) => {
      if (err1) {
        cb(err1);
      }
      else {
        resolutionModel.create({
          size: size,
          resolutionImageFileId: fileObject.id,
          imageCollectionResolutionId: imageCollectionObject.id
        }, function (err2, resolutionObject) {
          if (err2) {
            cb(err2);
          }
          else {
            fileModel.updateAll({id: fileObject.id}, {resolutionImageFileId: resolutionObject.id}, function(err3) {
              if (err3) {
                cb(err3);
              }
              else {
                cb(null, resolutionObject);
              }
            });
          }
        });
      }
    });
  };

  /**
   * Method used to upload a file to s3.
   * @param {Object} ctx
   * @param {Object} options
   * @param {Object} container
   * @param {Function} cb
   */
  ImageCollection.upload = (ctx, options, container, cb) => {
    const logger = ImageCollection.app.get('logger');

    // First we upload the file to amazon and save the metadata via the file model.
    fileModel.upload(ctx, options, container, (err1, fileObj) => {
      if (err1) {
        logger.error('An error occurred during upload of imagecollection', {error: err1});
        cb(err1);
      }
      else {
        // next we create an empty imageCollection
        ImageCollection.create({}, function (err2, imageCollectionObject) {
          if (err2) {
            logger.error('An error occurred while creating image collection', {error: err2});
            cb(err2);
          }
          else {
            // we now create a resolution object to hold the size of the image (for future queries).
            // this is linked to the imageCollection and the file we created earlier
            resolutionModel.create({
              size: 'original',
              imageCollectionResolutionId: imageCollectionObject.id
            }, function (err3, resolutionObject) {
              if (err3) {
                logger.error('An error occurred while creating resolution', {error: err3});
                cb(err3);
              }
              else {
                fileModel.updateAll({id: fileObj.id}, {resolutionImageFileId: resolutionObject.id}, function(err4) {
                  if (err4) {
                    logger.error('An error occurred during update of file', {error: err4});
                    cb(err4);
                  }
                  else {
                    // now it's time to find the object with relations and send it to the user
                    ImageCollection.findById(imageCollectionObject.id, {
                      include: [
                        {relation: 'resolutions', scope: {include: ['image']}}
                      ]
                    }, function (err5, imageCollectionInstance) {
                      if (err5) {
                        logger.error('An error occurred while finding image collection', {error: err5});
                        cb(err5);
                      }
                      else {
                        // We send the object to the consumer, and setup async jobs to add more resolutions to the collection.
                        cb(null, imageCollectionInstance);

                        buckets.forEach((metadata) => {
                          imageQueue.add({
                            fileObj: fileObj,
                            bucket: metadata.bucket,
                            size: metadata.size,
                            imageCollection: imageCollectionInstance
                          }, imageQueueConfig);
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  };

  ImageCollection.remoteMethod(
    'upload',
    {
      description: 'Uploads an image.',
      accepts: [
        {arg: 'ctx', type: 'object', http: {source: 'context'}},
        {arg: 'options', type: 'object', http: {source: 'query'}},
        {arg: 'container', type: 'string', http: {source: 'query'}}
      ],
      returns: {
        arg: 'imageCollection', type: 'object', root: true
      },
      http: {verb: 'post'}
    }
  );

  /**
   * Looks up an image by id and size, then serves that image.
   * @param {Object} ctx
   * @param {Number} id
   * @param {String} size
   * @param {Function} cb
   */
  ImageCollection.download = function downloadImageFromImageCollection (ctx, id, size, cb) {
    if (
      size !== 'original' && size !== 'large' && size !== 'medium' && size !== 'small' && size !== 'large-square'
      && size !== 'medium-square' && size !== 'small-square' && size !== 'thumbnail'
    ) {
      cb('Cannot recognize the requested size!');
    }
    else {
      ImageCollection.findById(id, {include: [{relation: 'resolutions', scope: {include: ['image']}}]}, function (err, imageCollection) {
        if (err) {
          cb(err);
        }
        else {
          const resolutions = imageCollection.resolutions();
          if (resolutions.length > 0) {
            let resolution = resolutions[0];
            resolutions.forEach((resolutionObject) => {
              if (resolutionObject.size === size) {
                resolution = resolutionObject;
              }
            });

            cb(null, resolution.image());
          }
          else {
            cb('Could not find any resolutions');
          }
        }
      });
    }
  };

  ImageCollection.remoteMethod(
    'download',
    {
      description: 'Downloads an image of the specified size, if that\'s not available, it downloads an image.',
      accepts: [
        {arg: 'ctx', type: 'object', http: {source: 'context'}},
        {arg: 'id', type: 'number', required: true, description: 'Id of the Image Collection.'},
        {arg: 'size', type: 'string', required: true, description: 'Size of the image, either: original, small, medium or large.'}
      ],
      returns: {
        arg: 'image', type: 'object', root: true
      },
      http: {path: '/:id/download/:size', verb: 'get'}
    }
  );

  /**
   * Deletes a resolution and creates a job in the queue to recreate that resolution.
   * @param ctx - Context object
   * @param id - id of imageCollection
   * @param size - Which resolution to delete
   * @param cb - a callback for when were ready to return the api call.
   */
  ImageCollection.resize = function resizeImageFromImageCollectionId(ctx, id, size, cb) {
    if (
      size !== 'original' && size !== 'large' && size !== 'medium' && size !== 'small' && size !== 'large-square'
      && size !== 'medium-square' && size !== 'small-square' && size !== 'thumbnail'
    ) {
      cb('Cannot recognize the requested size!');
    }
    else {
      const whereClause = {include: [{relation: 'resolutions', scope: {include: ['image']}}]};
      ImageCollection.findById(id, whereClause, function findImageToResize(err, imageCollection) {
        if (err) {
          return cb(err);
        }

        imageCollection.resolutions().forEach(resolution => {
          // Find the requested size.
          if (resolution.size === size) {
            // Delete it.
            resolution.delete();
          }

          // Find the original
          if (resolution.size === 'original') {
            // Add job to queue.
            const bucket = amazonBuckets[size];
            imageQueue.add({
              fileObj: resolution.image(),
              bucket: bucket,
              size: size,
              imageCollection: imageCollection
            }, imageQueueConfig);
          }
        });

        return cb(null, imageCollection);
      });
    }
  }

  ImageCollection.remoteMethod(
    'resize',
    {
      description: '',
      accepts: [
        {arg: 'ctx', type: 'object', http: {source: 'context'}},
        {arg: 'id', type: 'number', required: true, description: 'Id of the Image Collection.'},
        {arg: 'size', type: 'string', required: true, description: 'Size of the image.'}
      ],
      returns: {
        arg: 'imageCollection', type: 'object', root: true
      },
      http: {verb: 'post'}
    }
  );

  ImageCollection.observe('before delete', function(ctx, next) {
    ImageCollection.find({where: ctx.where, include: ['resolutions']}, (err, instances) => {
      instances = Array.isArray(instances) ? instances : [instances];
      instances.forEach((instance) => {
        instance.resolutions.destroyAll();
      });
    });

    next();
  });
};
