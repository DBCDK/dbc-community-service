'use strict';

/**
 * @file: imageCollection.js - Contains custom logic for imageCollections.
 * @param ImageCollection - Model class.
 */

module.exports = function(ImageCollection) {
  ImageCollection.createResolution = (fileBuffer, container, fileObj, size, imageCollectionObject, cb) => {
    let fileName = fileObj.name.split('.');
    const extension = fileName[fileName.length - 1];
    fileName.pop();
    fileName = fileName.join('.') + '_' + size + '.' + extension;
    ImageCollection.app.models.file.uploadFromBuffer(container, fileName, fileBuffer, fileObj.type, (err1, fileObject) => {
      if (err1) {
        cb(err1);
      }
      else {
        ImageCollection.app.models.resolution.create({
          size: size,
          resolutionImageFileId: fileObject.id,
          imageCollectionResolutionId: imageCollectionObject.id
        }, function (err2, resolutionObject) {
          if (err2) {
            cb(err2);
          }
          else {
            ImageCollection.app.models.file.updateAll({id: fileObject.id}, {resolutionImageFileId: resolutionObject.id}, function(err3) {
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

  ImageCollection.upload = (ctx, options, container, cb) => {
    // First we upload the file to amazon and save the metadata via the file model.
    ImageCollection.app.models.file.upload(ctx, options, container, (err1, fileObj) => {
      if (err1) {
        cb(err1);
      }
      else {
        // next we create an empty imageCollection
        ImageCollection.create({}, function (err2, imageCollectionObject) {
          if (err2) {
            cb(err2);
          }
          else {
            // we now create a resolution object to hold the size of the image (for future queries).
            // this is linked to the imageCollection and the file we created earlier
            ImageCollection.app.models.resolution.create({
              size: 'original',
              imageCollectionResolutionId: imageCollectionObject.id
            }, function (err3, resolutionObject) {
              if (err3) {
                cb(err3);
              }
              else {
                ImageCollection.app.models.file.updateAll({id: fileObj.id}, {resolutionImageFileId: resolutionObject.id}, function(err4) {
                  if (err4) {
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
                        cb(err5);
                      }
                      else {
                        // We send the object to the consumer, and setup async jobs to add more resolutions to the collection.
                        cb(null, imageCollectionInstance);

                        const buckets = [
                          {bucket: 'uxdev-biblo-imagebucket-small', size: 'small'},
                          {bucket: 'uxdev-biblo-imagebucket-medium', size: 'medium'},
                          {bucket: 'uxdev-biblo-imagebucket-large', size: 'large'}
                        ];
                        const imageQueue = ImageCollection.app.get('imageQueue');

                        buckets.forEach((metadata) => {
                          imageQueue.add({
                            fileObj: fileObj,
                            bucket: metadata.bucket,
                            size: metadata.size,
                            imageCollection: imageCollectionInstance
                          });
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

  ImageCollection.download = function downloadImageFromImageCollection (ctx, id, size, cb) {
    if (size !== 'original' && size !== 'large' && size !== 'medium' && size !== 'small') {
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

            ctx.res.redirect('/' + resolution.image().url);
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
      http: {path: '/:id/download/:size', verb: 'get'}
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
