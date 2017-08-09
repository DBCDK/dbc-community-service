
import {_} from 'lodash';

module.exports = function(Review) {

  Review.beforeIndex = function(instance, doc) {
    const NUM_LIKES_KEY = 'numLikes';

    // index number of likes, to be used for sorting
    if(typeof instance.likes === 'function') {

      // instance.likes is a loopback function, which
      // has to be invoked to collect actual values
      const likes = instance.likes();

      // count unique profileId's across the list of likes
      const numLikes = _.uniq(likes.map(like => like.profileId)).length;

      doc[NUM_LIKES_KEY] = numLikes;

    } else {
      doc[NUM_LIKES_KEY] = 0;
    }
  }

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

  function addBibliographicTitle(model, titles, reviewId, next) {
    const logger = Review.app.get('logger');
    // if (typeof title !== 'string' || title.length === 0) {
    //   return next('title is not a string');
    // }
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
      model.find({where: {or: titles.map(t =>({title: t}))}}, (findErr, findRes) => {
        const promises = [];

        // Relate titles which already exist, to review
        findRes.forEach(r => {
          // Remove the found title from titles array
          titles.splice(titles.indexOf(r.title), 1);

          const promise = new Promise((resolve, reject) => {
            r.reviews.add(review, () => {
              resolve();
            });
          });
          promises.push(promise);
        });

        // Rest of titles need to be first created then related to review
        titles.forEach(t => {
          const promise = new Promise((resolve, reject) => {
            model.create({title: t}, (createErr, createRes) => {
              if (!createErr) {
                createRes.reviews.add(review, () => {
                  resolve();
                });
              }
            });
          });
          promises.push(promise);
        });

        Promise.all(promises).then(() => {
          // Saving the review will notify observers
          // i.e. the review will be indexed.
          // Did not find a way to get triggers to work with
          // 'hasAndBelongsToMany' relations, since the subject/genre models
          // do not have foreign key to review-id.
          review.save();
        });

        next(null, 'OK');
      });
    });
  }

  Review.addSubject = function addSubject(ctx, subject, reviewId, next) {
    addBibliographicTitle(Review.app.models.BibliographicSubject, subject.split(','), reviewId, next);
  };
  Review.addGenre = function addGenre(ctx, genre, reviewId, next) {
    addBibliographicTitle(Review.app.models.BibliographicGenre, genre.split(','), reviewId, next);
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
      const instance = ctx.instance || ctx.currentInstance;
      data = Object.assign({}, instance.__data, ctx.data);

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

  Review.remoteMethod('addGenre',
    {
      description: 'Relates a genre to a review',
      accepts: [
        {arg: 'ctx', type: 'object', http: {source: 'context'}},
        {arg: 'genre', type: 'string', http: {source: 'query'}},
        {arg: 'reviewId', type: 'integer', http: {source: 'query'}}
      ],
      returns: {
        arg: 'fileObject', type: 'object', root: true
      },
      http: {verb: 'post'}
    });
};
