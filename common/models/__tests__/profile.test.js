process.env.TESTING = true;

import expect from 'expect';
import superagent from 'superagent';
import app from '../../../server/server';
import * as testutils from './testutils';

describe('Test profile endpoints and functionality', () => {
  let server;

  beforeEach(done => {
    server = app.listen(done);
  });

  afterEach(done => {
    server.close(done);
  });

  it('should respond with an array', done => {
    superagent
      .get(`${app.get('url')}api/Profiles`)
      .set('Accept', 'application/json')
      .end((err, res) => {
        expect(err).toNotExist();
        expect(Array.isArray(res.body)).toExist();
        done();
      });
  });

  it('should create a profile, and login via unilogin', done => {
    testutils
      .createProfile(app.get('url'))
      .then(createResponse => {
        return testutils.loginViaUnilogin(
          app.get('url'),
          createResponse.username
        );
      })
      .then(loginResponse => {
        expect(typeof loginResponse.id).toEqual('string');
        expect(typeof loginResponse.profileId).toEqual('number');
        expect(typeof loginResponse.profile).toEqual('object');
        done();
      });
  });
  it('should delete a profile and related Objects', async () => {
    // Helpers
    const getGroupsForProfile = async id => {
      const filter = `{"where":{"groupownerid": ${id}}}`;
      return (await superagent.get(
        `${app.get('url')}api/Groups?filter=${filter}`
      )).body;
    };

    const getReviewsForProfile = async id => {
      const filter = `{"where":{"reviewownerid": ${id}}}`;
      return (await superagent.get(
        `${app.get('url')}api/Reviews/?filter=${encodeURIComponent(filter)}`
      )).body;
    };

    // Create profile and relations
    const profile = await testutils.createProfile(app.get('url'));
    await testutils.createGroup(app.get('url'), {
      groupownerid: profile.id
    });
    await testutils.createReview(app.get('url'), {
      reviewownerid: profile.id
    });
    // check if relations exists
    expect((await getGroupsForProfile(profile.id)).length).toEqual(1);
    expect((await getReviewsForProfile(profile.id)).length).toEqual(1);

    // Delete profile
    await superagent.delete(`${app.get('url')}api/Profiles/${profile.id}`);

    // check if relations are deleted
    expect((await getGroupsForProfile(profile.id)).length).toEqual(0);
    expect((await getReviewsForProfile(profile.id)).length).toEqual(0);
  });
});
