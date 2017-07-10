

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

  Review.addSubject = function addSubject(ctx, subject, reviewId, next) {
    const logger = Review.app.get('logger');
    if (typeof subject !== 'string' || subject.length === 0) {
      return next('subject is not a string');
    }

    if (typeof reviewId !== 'number' || reviewId <= 0) {
      return next('reviewId is not a valid number');
    }

    Review.find({where: {id: reviewId}}, (err, res) => {
      if (err || res.length < 1) {
        const couldNotFindError = new Error('Could not find review');
        couldNotFindError.status = 404;
        logger.error('Could not find review', err);
        return next(couldNotFindError);
      }

      const review = res[0];
      const bibliographicSubject = Review.app.models.BibliographicSubject;
      bibliographicSubject.find({where: {title: subject}}, (subjectErr, subjectRes) => {
        if (subjectRes.length > 0) {
          review.subjects.add(subjectRes[0]);
          return next(null, 'OK');
        }

        bibliographicSubject.create({title: subject}, (subjectCreateErr, subjectCreateRes) => {
          if (subjectCreateErr) {
            return next(subjectCreateErr);
          }

          review.subjects.add(subjectCreateRes);
          return next(null, 'OK');
        });

      });
    });

  };

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

  Review.remoteMethod('addSubject',
    {
      description: 'Relates a subject to a review',
      accepts: [
        {arg: 'ctx', type: 'object', http: {source: 'context'}},
        {arg: 'subject', type: 'string', http: {source: 'query'}},
        {arg: 'reviewId', type: 'integer', http: {source: 'query'}}
      ],
      returns: {
        arg: 'fileObject', type: 'object', root: true
      },
      http: {verb: 'post'}
    });

};
