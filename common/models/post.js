import series from 'async/series';

const CONTAINERS_URL = 'api/fileContainers/';

/**
 * Only query deleted Models if requested explicit
 * @param query
 * @returns {*}
 */
function queryDeleted(query) {
  const queryNonDeleted = {markedAsDeleted: null, groupDeleted: false};

  if (!query.deleted && !(query.where && query.where.id)) {
    if (!query.where || Object.keys(query.where).length === 0) {
      query.where = queryNonDeleted;
    }
    else {
      query.where = Object.assign({}, query.where, queryNonDeleted);
    }
  }
  return query;
}


module.exports = function (Post) {

  Post.on('dataSourceAttached', function initSoftDeleteOnPost() {
    const _find = Post.find;
    Post.find = function findDeleted(query = {}, ...rest) {
      return _find.call(Post, queryDeleted(query), ...rest);
    };
  });

  Post.observe('before save', function videoUpload(ctx, next) {
    const logger = Post.app.get('logger');
    let data; // this is for accessing properties of the new object and, if they exist, video details.

    if (ctx.isNewInstance) {
      data = Object.assign({}, ctx.instance.__data);
    }
    else if (ctx.currentInstance) {
      data = Object.assign({}, ctx.currentInstance.__data, ctx.data);
    }
    else {
      // Abort if no instance is found
      next();
      return;
    }

    logger.info('post before save', data);

    if (data && data.pdffile && data.pdfContainer && data.pdfmimetype) {
      ctx.hookState.pdf = {
        pdffile: data.pdffile,
        pdfContainer: data.pdfContainer,
        pdfmimetype: data.pdfmimetype
      };
    }

    if (data && data.mimetype && data.videofile && data.container) {
      // We have info on a new video, time to create models and attach it to the new post object.
      Post.app.models.videoCollection.newVideoCollection(data, function newVideoCollectionCallback(err, info) {
        if (err) {
          logger.error('An error occurred during post before save', {error: err});
          next(err);
        }
        else {
          logger.info('Created new video resolution', info);
          ctx.hookState.postVideoCollection = info.id;
          next();
        }
      });
    }
    else {
      next();
    }
  });

  Post.observe('after save', function afterPostSave(ctx, next) {
    if (!ctx.instance) {
      next();
      return;
    }

    const logger = Post.app.get('logger');
    logger.info('a post was created', ctx.instance.__data);

    // If the user has attached a video or a pdf we want to save that relation.
    series([
      function relateVideoToPost(cb) {
        if (ctx.hookState.postVideoCollection) {
          // attach the videoCollection to the newly saved post.
          Post.app.models.videoCollection.updateAll(
            {
              id: ctx.hookState.postVideoCollection
            },
            {
              postVideoCollection: ctx.instance.id
            }, function (err) {
              if (err) {
                logger.error('An error occurred during post after save', {error: err});
                cb(err);
              }
              else {
                cb();
              }
            }
          );
        }
        else {
          cb();
        }
      },
      function relatePdfToPost(cb) {
        if (ctx.hookState.pdf) {
          // attach the pdf file to the newly saved post.
          Post.app.models.file.create({
            container: ctx.hookState.pdf.pdfContainer,
            name: ctx.hookState.pdf.pdffile,
            type: ctx.hookState.pdf.pdfmimetype,
            url: CONTAINERS_URL + encodeURIComponent(ctx.hookState.pdf.pdfContainer) + '/download/' + encodeURIComponent(ctx.hookState.pdf.pdffile),
            postPdfAttachment: ctx.instance.id
          }, function (err, fileObj) {
            if (err) {
              logger.error('An error occurred during post after save, pdf', {error: err});
              cb(err);
            }
            else {
              const virusQueue = Post.app.get('virusQueue');
              virusQueue.add({
                fileObj
              }, {
                attempts: 5,
                timeout: 300000 // 5 minutes.
              });

              cb();
            }
          });
        }
        else {
          cb();
        }
      }],
      // The series is done, if it has an error throw it back at the user.
      err => next(err)
    );
  });

  Post.unlike = function unlike(ctx, profileId, postId, next) {
    const logger = Post.app.get('logger');

    Post.findOne({where: {id: postId}, include: 'likes'}, (err, post) => {
      if (err || !post) {
        const couldNotFindError = new Error('Could not find post');
        couldNotFindError.status = 404;
        logger.error('Could not find post', err);
        return next(couldNotFindError);
      }

      const promises = [];
      const likes = post.likes();
      if (likes && likes.length) {
        likes.forEach(l => {
          if (l.profileId === profileId) {
            const promise = new Promise(resolve => {
              l.delete(() => resolve());
            });
            promises.push(promise);
          }
        });
      }

      Promise.all(promises).then(() => {
        // Saving the post will notify observers
        // i.e. the post will be indexed.
        post.save();
        next();
      });
    });
  };

  Post.remoteMethod('unlike',
    {
      description: 'Unlikes a post for given profile',
      accepts: [
        {arg: 'ctx', type: 'object', http: {source: 'context'}},
        {arg: 'profileId', type: 'integer', http: {source: 'query'}},
        {arg: 'postId', type: 'integer', http: {source: 'query'}}
      ],
      returns: {
        arg: 'fileObject', type: 'object', root: true
      },
      http: {verb: 'del'}
    });
};
