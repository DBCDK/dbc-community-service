

module.exports = function(Review) {

  Review.afterSearch = function reviewAfterSearch (params, result) {
    if (
      params.body &&
      params.body.size &&
      result.aggregations &&
      result.aggregations.range &&
      result.aggregations.range.buckets &&
      result.aggregations.range.buckets[0] &&
      result.aggregations.range.buckets[0].pids &&
      result.aggregations.range.buckets[0].pids.buckets
    ) {
      return result.aggregations.range.buckets[0].pids.buckets
        .sort((a, b) => b.pid_score.value-a.pid_score.value)
        .slice(0, params.body.size)
        .map(a => a.key);
    }

    return result;
  };

  Review.observe('before save', function videoUpload(ctx, next) {
    const logger = Review.app.get('logger');

    let data; // this is for accessing properties of the new object and, if they exist, video details.

    if (ctx.isNewInstance) {
      data = Object.assign({}, ctx.instance.__data);
    }
    else {
      data = Object.assign({}, ctx.currentInstance.__data, ctx.data);
    }

    logger.info('review before save', data);

    if (data && data.mimetype && data.videofile && data.container) {
      // We have info on a new video, time to create models and attach it to the new post object.
      Review.app.models.videoCollection.newVideoCollection(data, function newVideoCollectionCallback(err, info) {
        if (err) {
          logger.error('An error occurred during review before save', {error: err});
          next(err);
        }
        else {
          logger.info('Created new video resolution', info);
          ctx.hookState.reviewVideoCollection = info.id;
          next();
        }
      });
    }
    else {
      next();
    }
  });

  Review.observe('after save', function afterReviewSave(ctx, next) {
    const logger = Review.app.get('logger');

    // grab the id from the hookState
    if (ctx.hookState.reviewVideoCollection) {
      // attach the videoCollection to the newly saved post.
      Review.app.models.videoCollection.updateAll(
        {
          id: ctx.hookState.reviewVideoCollection
        },
        {
          reviewVideoCollection: ctx.instance.id
        }, function (err) {
          if (err) {
            logger.error('An error occurred during review after save', {error: err});
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
