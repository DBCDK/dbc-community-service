'use strict';

module.exports = function(Comment) {  // eslint-disable-line no-unused-vars
  Comment.observe('before save', function videoUpload(ctx, next) {
    const logger = Comment.app.get('logger');

    let data; // this is for accessing properties of the new object and, if they exist, video details.

    if (ctx.isNewInstance) {
      data = Object.assign({}, ctx.instance.__data);
    }
    else {
      data = Object.assign({}, ctx.currentInstance.__data, ctx.data);
    }

    logger.info('comment before save', data);

    if (data && data.mimetype && data.videofile && data.container) {
      // We have info on a new video, time to create models and attach it to the new post object.
      Comment.app.models.videoCollection.newVideoCollection(data, function newVideoCollectionCallback(err, info) {
        if (err) {
          logger.error('An error occurred during comment before save', {error: err});
          next(err);
        }
        else {
          logger.info('Created new video resolution', info);
          ctx.hookState.commentVideoCollection = info.id;
          next();
        }
      });
    }
    else {
      next();
    }
  });

  Comment.observe('after save', function afterCommentSave(ctx, next) {
    const logger = Comment.app.get('logger');

    // grab the id from the hookState
    if (ctx.hookState.commentVideoCollection) {
      // attach the videoCollection to the newly saved post.
      Comment.app.models.videoCollection.updateAll(
        {
          id: ctx.hookState.commentVideoCollection
        },
        {
          commentVideoCollection: ctx.instance.id
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
