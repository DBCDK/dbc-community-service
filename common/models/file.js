'use strict';

const CONTAINERS_URL = 'api/fileContainers/';

module.exports = function(File) {
  File.upload = (ctx, options, container, cb) => {
    ctx.req.params.container = container;
    if (!options) {
      options = {};
    }

    File.app.models.fileContainer.upload(ctx.req, ctx.result, options, function (err, fileObj) {
      if (err) {
        cb(err);
      }
      else {
        let fileInfo = fileObj.files.file[0];
        File.create({
          name: fileInfo.name,
          type: fileInfo.type,
          container: fileInfo.container,
          url: CONTAINERS_URL + fileInfo.container + '/download/' + fileInfo.name
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
};
