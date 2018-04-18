process.env.TESTING = true;

import expect from 'expect';
import superagent from 'superagent';
import app from '../../../server/server';
import * as testutils from './testutils';

describe('Test group endpoints and functionality', () => {
  let server;

  beforeEach(done => {
    server = app.listen(done);
  });

  afterEach(done => {
    server.close(done);
  });

  it('should respond with an array', done => {
    superagent
      .get(`${app.get('url')}api/Groups`)
      .set('Accept', 'application/json')
      .end((err, res) => {
        expect(err).toNotExist();
        expect(Array.isArray(res.body)).toExist();
        done();
      });
  });
  it('should transfer owner of group', async () => {
    const group = await testutils.createGroup(app.get('url'), {
      groupownerid: 10
    });

    await superagent.put(`${app.get('url')}api/Groups/${group.id}`).send({
      groupownerid: 20
    });
    const updatedGroup = (await superagent.get(
      `${app.get('url')}api/Groups/${group.id}`
    )).body;
    expect(updatedGroup.groupownerid).toEqual(20);
    expect(updatedGroup.name).toEqual(group.name);
    expect(updatedGroup.description).toEqual(group.description);
  });
});
