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

    // Abort if save is not done on an instance
    if (!ctx.instance) {
      next();
      return;
    }

    let data; // this is for accessing properties of the new object and, if they exist, video details.

    if (ctx.isNewInstance) {
      data = Object.assign({}, ctx.instance.__data);
    }
    else {
      data = Object.assign({}, ctx.currentInstance.__data, ctx.data);
    }

    logger.info('post before save', data);

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

    // grab the id from the hookState
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
            next(err);
          }
          else {
            next();
          }
        }
      );
    }
    else {
      next();
    }
  });
};
