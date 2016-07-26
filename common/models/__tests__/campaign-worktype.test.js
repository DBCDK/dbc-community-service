

process.env.TESTING = true;

import expect from 'expect';
import superagent from 'superagent';
import app from '../../../server/server';

describe('Test CampaignWorktype model and logic', () => {
  let server;

  beforeEach((done) => {
    server = app.listen(done);
  });

  afterEach((done) => {
    server.close(done);
  });

  it('Should return an array of workTypes on GET', (done) => {
    superagent
      .get(app.get('url') + 'api/CampaignWorktypes')
      .set('Accept', 'application/json')
      .end((err, res) => {
        expect(Array.isArray(res.body)).toExist();
        expect(res.body.length).toEqual(13); // should have 13 default campaign work types.
        expect(err).toNotExist('Make sure empty request doesn\'t produce error.'); // expect value to be falsy, ie. unset.
        done();
      });
  });
});
