'use strict';

process.env.TESTING = true;

import expect from 'expect';
import superagent from 'superagent';
import app from '../server';
import nock from 'nock';

describe('Test Amazon middlewares work as expected', () => {
  let server;

  beforeEach((done) => {
    server = app.listen(done);
  });

  afterEach((done) => {
    server.close(done);
  });

  it('should confirm a valid SNS subscription request', (done) => {
    let TopicArn = app.get('amazonConfig').TopicArn;
    let Token = '2336412f37fb687f5d51e6e241d44a2cb7ae2c383266b99f1bc3f9e7c9309243afcd4042622bb32a29c954ba1b51e314179ec5ffdc9b64276df6c183d67bf2bf1dfdbc77e0a600b99e74f1dcbd106005eceef54d480b3fd44422c56fc83e6d26539eafc92716a188ace228707ca3b9e0b44a5e03aae419ad1b552581d5cb06f522dcf53d826692903f4ef2c09b22027d'; // eslint-disable-line

    // Start by mocking the response that is expected when confirming an SNS subscription.
    nock('https://sns.eu-west-1.amazonaws.com')
      .post('/', {
        Action: 'ConfirmSubscription',
        Token,
        TopicArn,
        Version: '2010-03-31'
      })
      .reply(200, '<ConfirmSubscriptionResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/"> <ConfirmSubscriptionResult> <SubscriptionArn>Subscription ARN HERE</SubscriptionArn> </ConfirmSubscriptionResult> <ResponseMetadata> <RequestId>REQUEST ID HERE</RequestId> </ResponseMetadata> </ConfirmSubscriptionResponse>'); // eslint-disable-line

    // Send a confirm request to the community service
    superagent
      .post(`${app.get('url')}`.slice(0, -1))
      .send(JSON.stringify({
        Type: 'SubscriptionConfirmation',
        MessageId: '9d9fe4fc-44cc-43c5-b365-4e14d32b5b1b',
        Token,
        TopicArn,
        Message: `You have chosen to subscribe to the topic ${TopicArn}.\nTo confirm the subscription, visit the SubscribeURL included in this message.`,
        SubscribeURL: `https://sns.eu-west-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=${TopicArn}&Token=${Token}`,
        Timestamp: (new Date()).toISOString(),
        SignatureVersion: '1',
        Signature: 'e2bolw1MtXR/lzJ36WBlouYxzTFz1QUgkKbF7gxgx8ndLhcgPOxyq5FeOrv1J20TKGEJ07QYpUhfC3TF9A19cI20cPo9WaZopzwJTTT8+R1cRwqDMPCVTFlC5iCXhxDmSWH3hMPi248WOrRqYFSSfgk0fKTyGI12nrUnw/SQLyaxZbzzPmsXRtuDQoWIbvO9HidGeLvL/yc8+dEbcciztptsKcZjoiDAqVCKsVjzWj91VMZyaONMQly5BjPjMQBy00+beLuCnHao6Ty3fvyv+O5+2KCtlSAuyKfDfkAokQMwdTGU4kURW8YKqglTs709B3KQadRSIwvr1Kb9NOTXeg==', // eslint-disable-line
        SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-bb750dd426d95ee9390147a5624348ee.pem'
      }))
      .set('Content-Type', 'text/plain')
      .set('x-amz-sns-message-type', 'SubscriptionConfirmation')
      .end((err, res) => {
        // Check that no error occurred (IE. we were successful in the subscription).
        expect(err).toNotExist();

        // Make sure we get the expected response (Nothing).
        expect(res.body).toEqual({});

        // And were done.
        done();
      });
  });

  it('should return an error on invalid request', (done) => {
    let TopicArn = 'Not actually the topic arn';
    let Token = '2336412f37fb687f5d51e6e241d44a2cb7ae2c383266b99f1bc3f9e7c9309243afcd4042622bb32a29c954ba1b51e314179ec5ffdc9b64276df6c183d67bf2bf1dfdbc77e0a600b99e74f1dcbd106005eceef54d480b3fd44422c56fc83e6d26539eafc92716a188ace228707ca3b9e0b44a5e03aae419ad1b552581d5cb06f522dcf53d826692903f4ef2c09b22027d'; // eslint-disable-line

    // suppress error output
    let old_error = console.error; // eslint-disable-line
    console.error = () => {}; // eslint-disable-line

    superagent
      .post(`${app.get('url')}api/Likes`.slice(0, -1))
      .send(JSON.stringify({
        Type: 'SubscriptionConfirmation',
        MessageId: '9d9fe4fc-44cc-43c5-b365-4e14d32b5b1b',
        Token,
        TopicArn,
        Message: `You have chosen to subscribe to the topic ${TopicArn}.\nTo confirm the subscription, visit the SubscribeURL included in this message.`,
        SubscribeURL: `https://sns.eu-west-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=${TopicArn}&Token=${Token}`,
        Timestamp: (new Date()).toISOString(),
        SignatureVersion: '1',
        Signature: 'e2bolw1MtXR/lzJ36WBlouYxzTFz1QUgkKbF7gxgx8ndLhcgPOxyq5FeOrv1J20TKGEJ07QYpUhfC3TF9A19cI20cPo9WaZopzwJTTT8+R1cRwqDMPCVTFlC5iCXhxDmSWH3hMPi248WOrRqYFSSfgk0fKTyGI12nrUnw/SQLyaxZbzzPmsXRtuDQoWIbvO9HidGeLvL/yc8+dEbcciztptsKcZjoiDAqVCKsVjzWj91VMZyaONMQly5BjPjMQBy00+beLuCnHao6Ty3fvyv+O5+2KCtlSAuyKfDfkAokQMwdTGU4kURW8YKqglTs709B3KQadRSIwvr1Kb9NOTXeg==', // eslint-disable-line
        SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-bb750dd426d95ee9390147a5624348ee.pem'
      }))
      .set('Content-Type', 'text/plain')
      .set('x-amz-sns-message-type', 'SubscriptionConfirmation')
      .end((err) => {
        // Bad request should produce an error
        expect(err).toExist();
        expect(err.status).toEqual(404);
        expect(err.response.text).toContain('Error');

        // restore console output
        console.error = old_error; // eslint-disable-line
        done();
      });
  });

  it('should create a resolution when receiving a valid notification from ElasticEncoder', (done) => {
    let TopicArn = app.get('amazonConfig').TopicArn;

    // Start by creating a post with a video
    superagent
      .post(`${app.get('url')}api/Posts`)
      .send({
        title: ' ',
        content: 'bob er sej',
        timeCreated: '2016-03-07',
        postownerid: 0,
        postcontainergroupid: 0,
        groupid: 0,
        mimetype: 'video/quicktime',
        videofile: 'uploads/1457350826968_25_test.mov',
        container: 'uxdev-biblo-input-videobucket'
      })
      .end((postCreateError, postCreateResponse) => {
        expect(postCreateError).toNotExist();
        expect(Object.keys(postCreateResponse.body)).toInclude('id');

        // next send a notification with a completed Elastic Encoder job
        superagent
          .post(`${app.get('url')}`.slice(0, -1))
          .send(JSON.stringify({
            Type: 'Notification',
            MessageId: 'c729e6eb-1c42-530e-a4ef-a9bcb4be20ac',
            TopicArn,
            Subject: 'Amazon Elastic Transcoder has finished transcoding job 1457366706277-el5ihc.',
            Message: JSON.stringify({ // Double stringified cause that's how amazon does it.
              state: 'COMPLETED',
              version: '2012-09-25',
              jobId: '1457366706277-el5ihc',
              pipelineId: '1456826915509-r6pfck',
              input: {
                key: 'uploads/1457366705388_25_1457346078061_70_Horse_Front_Flip!.mov'
              },
              outputs: [{
                id: '1',
                presetId: '1351620000001-100070',
                key: '1457366705388_25_1457346078061_70_Horse_Front_Flip!.mp4',
                thumbnailPattern: '1457366705388_25_1457346078061_70_Horse_Front_Flip!_thumb_{count}',
                status: 'Complete',
                duration: 7,
                width: 854,
                height: 480
              }],
              userMetadata: {
                mimetype: 'video/mp4', postId: postCreateResponse.body.id, destinationContainer: 'uxdev-biblo-output-videobucket'
              }
            }),
            Timestamp: '2016-03-07T16:05:16.286Z',
            SignatureVersion: '1',
            Signature: 'fU6i8r+11DIpDBab102keARtoJYzeJgJkdYd8sRNglIEi/q6AzbZr2iEbwwjoy62GD23Jdm3oA5/rYo+Zg4r1H8aTCGo5lF6hcH4H3Ty+ztigx+qkOMo9ID/ES2uVdUNTXqLD+++x846l6Mn51BC2GanJkuTu79icoZOy87pjzLlwqkjuNYdjj6mzg6hE3Uqx1SkhJQwMQNIGvWZSV6ti45ZjblfungDUxNpuf814rUoMDPO3DtcD/X6SWNbJMxH3zR1YbuZLutST4q797Bb+IA+vrqilu+6dE3txWqr60vPbPzyWZAdyXC6TTZ2fLv0ZqxfW4mJ/+/KU+GBTa1ASA==', // eslint-disable-line
            SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-bb750dd426d95ee9390147a5624348ee.pem',
            UnsubscribeURL: 'https://sns.eu-west-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn='
          }))
          .set('Content-Type', 'text/plain')
          .set('x-amz-sns-message-type', 'Notification')
          .end((err, res) => {
            expect(err).toNotExist();
            expect(res.body).toEqual({});

            // lastly we check that the new resolution has been created and associated with the post we originally created.
            superagent
              .get(`${app.get('url')}api/Posts/${postCreateResponse.body.id}?filter=${JSON.stringify({include: [{relation: 'video', scope: {include: ['resolutions']}}]})}`)
              .end((postGetError, postGetResponse) => {
                expect(postGetError).toNotExist();
                expect(Object.keys(postGetResponse.body)).toInclude('video');
                expect(Object.keys(postGetResponse.body.video)).toInclude('resolutions');
                expect(Array.isArray(postGetResponse.body.video.resolutions)).toExist();
                expect(postGetResponse.body.video.resolutions.length).toEqual(2);
                done();
              });
          });
      });
  });
});
