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
        apiVersion: amazonConfig.snsApiVersion,
        region: amazonConfig.region,
        accessKeyId: amazonConfig.keyId,
        secretAccessKey: amazonConfig.key
      });
      sns.confirmSubscription({
        Token: confirmBody.Token,
        TopicArn: confirmBody.TopicArn
      }, function(err, data) {
        if (err) {
          logger.info('An error occurred during confirmation', err);
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
        message.userMetadata.postId &&
        message.userMetadata.destinationContainer &&
        message.userMetadata.mimetype &&
        message.outputs
      ) {
        // time to attach the newly converted video to a videoCollection.
        req.app.models.Post.findById(message.userMetadata.postId, {include: ['video']}, function (err, postObject) {
          if (postObject && postObject.video && postObject.video().id) {
            req.app.models.VideoCollection.createResolution(postObject.video().id, message, function(err2, info) {
              if (err2) {
                logger.info('error occurred during creation of resolution', err2);
              }
              else {
                logger.info('created resolution from notification', info);
              }
            });
          }
        });
      }
    }

    return res.end();
  }

  next();
}
