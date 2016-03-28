'use strict';

process.env.TESTING = true;

import expect from 'expect';
import superagent from 'superagent';
import app from '../../../server/server';

describe('Test Comment model and logic', () => {
  let server;

  beforeEach((done) => {
    server = app.listen(done);
  });

  afterEach((done) => {
    server.close(done);
  });

  it('should get comments in an array.', (done) => {
    superagent
      .get('http://localhost:3000/api/Comments')
      .set('Accept', 'application/json')
      .end((err, res) => {
        expect(Array.isArray(res.body)).toExist();
        expect(err).toNotExist('Make sure empty request doesn\'t produce error.'); // expect value to be falsy, ie. unset.
        done();
      });
  });

  it('should test adding a comment.', (done) => {
    let comment = {
      content: 'Dette er en test kommentar ' + Date.now(),
      timeCreated: '2016-03-23',
      commentownerid: 0,
      commentcontainerpostid: 0,
      postid: 0
    };

    superagent
      .post('http://localhost:3000/api/Comments')
      .send(comment)
      .set('Accept', 'application/json')
      .end((err1, res1) => {
        expect(err1).toNotExist();
        let commentPostResponse = res1.body;

        superagent
          .get('http://localhost:3000/api/Comments')
          .set('Accept', 'application/json')
          .end((err2, res2) => {
            expect(err2).toNotExist();
            expect(res2.body).toContain(commentPostResponse);
            done();
          });
      });
  });
});