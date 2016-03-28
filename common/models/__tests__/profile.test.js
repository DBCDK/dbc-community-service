'use strict';

process.env.TESTING = true;

import expect from 'expect';
import superagent from 'superagent';
import app from '../../../server/server';
import * as testutils from './testutils';

describe('Test profile endpoints and functionality', () => {
  let server;

  beforeEach((done) => {
    server = app.listen(done);
  });

  afterEach((done) => {
    server.close(done);
  });

  it('should respond with an array', (done) => {
    superagent
      .get(`${app.get('url')}api/Profiles`)
      .set('Accept', 'application/json')
      .end((err, res) => {
        expect(err).toNotExist();
        expect(Array.isArray(res.body)).toExist();
        done();
      });
  });
  
  it('should create a profile, and login via unilogin', (done) => {
    let profile;

    testutils.createProfile(app.get('url'))
      .then((createResponse) => {
        return testutils.loginViaUnilogin(app.get('url'), createResponse.username);
      })
      .then((loginResponse) => {
        expect(typeof loginResponse.id).toEqual('string');
        expect(typeof loginResponse.profileId).toEqual('number');
        expect(typeof loginResponse.profile).toEqual('object');
        done();
      });
  });
});
