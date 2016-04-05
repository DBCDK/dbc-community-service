'use strict';

import AWS from 'aws-sdk';

export function amazonSNSConfirmMiddleware (amazonConfig, req, res, next) {
  if (req.headers['x-amz-sns-message-type'] === 'SubscriptionConfirmation') {
    const logger = req.app.get('logger');
    const confirmBody = JSON.parse(req.body);
    logger.info('Got SNS confirm request', confirmBody);
    if (
      confirmBody.Type === 'SubscriptionConfirmation' &&
      confirmBody.TopicArn === amazonConfig.TopicArn
    ) {
      logger.info('Confirming SNS request');
      const sns = new AWS.SNS({
        apiVersion: amazonConfig.snsApiVersion
      });
      sns.confirmSubscription({
        Token: confirmBody.Token,
        TopicArn: confirmBody.TopicArn
      }, function(err, data) {
        if (err) {
          logger.error('An error occurred during confirmation', err);
        }
        else {
          logger.info('The SNS confirm request was accepted!', data);
        }

        res.end();
      });
    }
    else {
      next();
    }
  }
  else {
    next();
  }
}

export function amazonSNSNotificationMiddleware (amazonConfig, req, res, next) {
  if (req.headers['x-amz-sns-message-type'] === 'Notification') {
    const logger = req.app.get('logger');
    const notificationBody = JSON.parse(req.body);
    logger.info('Got SNS notification!', notificationBody);
    if (
      notificationBody.TopicArn &&
      notificationBody.TopicArn === amazonConfig.TopicArn
    ) {
      const message = JSON.parse(notificationBody.Message);
      if (
        message.state === 'COMPLETED' &&
        message.userMetadata &&
        message.userMetadata.destinationContainer &&
        message.userMetadata.mimetype &&
        message.outputs
      ) {
        if (message.userMetadata.postId) {
          // time to attach the newly converted video to a videoCollection.
          req.app.models.Post.findById(message.userMetadata.postId, {include: ['video']}, function (err, postObject) {
            if (err) {
              logger.error('error occurred during creation of resolution', {error: err});
              return next();
            }

            if (postObject && postObject.video && postObject.video().id) {
              req.app.models.VideoCollection.createResolution(postObject.video().id, message, function(err2, info) {
                if (err2) {
                  logger.error('error occurred during creation of resolution', {error: err2});
                  return next();
                }

                logger.info('created resolution from notification', info);
              });
            }
          });
        }
        else if (message.userMetadata.commentId) {
          // time to attach the newly converted video to a videoCollection.
          req.app.models.Comment.findById(message.userMetadata.commentId, {include: ['video']}, function (err, commentObject) {
            if (err) {
              logger.error('error occurred during creation of resolution', {error: err});
              return next();
            }

            if (commentObject && commentObject.video && commentObject.video().id) {
              req.app.models.VideoCollection.createResolution(commentObject.video().id, message, function(err2, info) {
                if (err2) {
                  logger.error('error occurred during creation of resolution', {error: err2});
                  return next();
                }

                logger.info('created resolution from notification', info);
              });
            }
          });
        }
      }
    }

    return res.end();
  }

  next();
}
