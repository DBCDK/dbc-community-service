'use strict';

process.env.TESTING = true;

import expect from 'expect';
import superagent from 'superagent';
import app from '../../../server/server';

describe('Test CommunityRole model and logic', () => {
  let server;

  beforeEach((done) => {
    server = app.listen(done);
  });

  afterEach((done) => {
    server.close(done);
  });

  it('should get community roles in an array. There should be two roles.', (done) => {
    superagent
      .get('http://localhost:3000/api/CommunityRoles')
      .set('Accept', 'application/json')
      .end((err, res) => {
        expect(err).toNotExist();
        expect(Array.isArray(res.body)).toExist();
        expect(res.body.length).toEqual(2);
        done();
      });
  });
});
