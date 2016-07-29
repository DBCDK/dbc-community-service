

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

  function updateVideo(ctx, data, next) {
    const logger = Review.app.get('logger');
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
  }

  Review.observe('before save', function videoUpload(ctx, next) {
    const logger = Review.app.get('logger');
    let data; // this is for accessing properties of the new object and, if they exist, video details.

    if (ctx.isNewInstance) {
      data = Object.assign({}, ctx.instance.__data);
      logger.info('review before save', data);

      // check that we do not have an existing review that is not deleted for the chosen pid
      Review.app.models.review.findOne({where: {markedAsDeleted: null, pid: data.pid, reviewownerid: data.reviewownerid}}, (error, review) => {
        if (!error && review) {
          logger.info('existing review', review);
          const err = new Error();
          err.status = 500;
          err.message = 'Eksisterende anmeldelse'; // note: we currently have a hook in the biblo.dk depending on this exact string
          next(err);
        }
        else {
          updateVideo(ctx, data, next);
        }
      });
    }
    else {
      data = Object.assign({}, ctx.currentInstance.__data, ctx.data);

      logger.info('review before save', data);
      // we are updating a existing review. Skip unique checks on pid + reviewownerid (to support altering old reviews)
      updateVideo(ctx, data, next);
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
