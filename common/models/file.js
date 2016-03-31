'use strict';

import AWS from 'aws-sdk';
import Busboy from 'busboy';

const CONTAINERS_URL = 'api/fileContainers/';
const s3 = new AWS.S3();

module.exports = function(File) {
  File.uploadFromBuffer = (container, file, buffer, mimetype, cb) => {
    s3.upload({
      Bucket: container,
      Key: file,
      Body: buffer
    }, function(err) {
      if (err) {
        cb(err);
      }
      else {
        File.create({
          name: file,
          type: mimetype,
          container: container,
          url: CONTAINERS_URL + container + '/download/' + file
        }, function (error, obj) {
          if (error !== null) {
            cb(error);
          }
          else {
            cb(null, obj);
          }
        });
      }
    });
  };

  File.upload = (ctx, options, container, cb) => {
    let busboy = new Busboy({headers: ctx.req.headers});
    const logger = File.app.get('logger');

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      s3.upload({
        Bucket: container,
        Key: filename,
        Body: file
      }, (err, data) => {
        if (err) {
          logger.error('An error occurred while uploading to amazon', {error: err});
          cb(err);
        }
        else {
          File.create({
            name: data.Key,
            type: mimetype,
            container: container,
            url: data.Location
          }, function (error, obj) {
            if (error) {
              logger.error('An error occurred while creating file entry', {error: error});
              cb(error);
            }
            else {
              cb(null, obj);
            }
          });
        }
      });
    });

    ctx.req.pipe(busboy);
  };

  File.remoteMethod(
    'upload',
    {
      description: 'Uploads a file',
      accepts: [
        {arg: 'ctx', type: 'object', http: {source: 'context'}},
        {arg: 'options', type: 'object', http: {source: 'query'}},
        {arg: 'container', type: 'string', http: {source: 'query'}}
      ],
      returns: {
        arg: 'fileObject', type: 'object', root: true
      },
      http: {verb: 'post'}
    }
  );

  File.observe('before delete', function(ctx, next) {
    File.find({where: ctx.where}, (err, instances) => {
      instances = Array.isArray(instances) ? instances : [instances];
      instances.forEach((instance) => {
        s3.deleteObject({
          Bucket: instance.container,
          Key: instance.name
        }, function() {});
      });
    });

    next();
  });
};
