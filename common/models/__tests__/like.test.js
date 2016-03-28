'use strict';

process.env.TESTING = true;

import expect from 'expect';
import superagent from 'superagent';
import app from '../../../server/server';

describe('Test like endpoints and functionality', () => {
  let server;

  beforeEach((done) => {
    server = app.listen(done);
  });

  afterEach((done) => {
    server.close(done);
  });

  it('should respond with an array', (done) => {
    superagent
      .get('http://localhost:3000/api/Likes')
      .set('Accept', 'application/json')
      .end((err, res) => {
        expect(err).toNotExist();
        expect(Array.isArray(res.body)).toExist();
        done();
      });
  });
});
