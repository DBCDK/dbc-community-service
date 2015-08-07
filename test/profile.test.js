'use strict';

/**
 * @file Write a short description here.
 */

import {expect, assert} from 'chai';
import request from 'supertest';
import app from '../server/server';

app.start();


describe('Testing Profile REST API', () => {

  let url = '127.0.0.1:3000';

  before(function(done) {
    // In our tests we use the test db
    done();
  });

  it('should be accessible', () => {
    request(url)
      .get('/')
      .send({})
      .end(function(err, result) {
        if (err) {
          console.log(err);
          throw err;
        }
        assert.equal(result.status, 200);
        done();
      });
  });
});
