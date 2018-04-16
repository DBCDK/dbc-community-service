process.env.TESTING = true;

import expect from 'expect';
import app from '../server';
import {
  createGroup,
  superAgentGetPromise
} from '../../common/models/__tests__/testutils';

describe('Test group rankings', () => {
  let server;

  beforeEach(done => {
    server = app.listen(done);
  });

  afterEach(done => {
    server.close(done);
  });

  it('should produce an array of groups when using group_pop sort', done => {
    let beforeBody;

    // First get groups
    const filter = encodeURIComponent(
      JSON.stringify({
        order: 'group_pop DESC'
      })
    );

    superAgentGetPromise(`${app.get('url')}api/Groups?filter=${filter}`)
      .then(groupResponse => {
        beforeBody = groupResponse;

        // Next, create some groups
        return Promise.all([
          createGroup(app.get('url'), {}),
          createGroup(app.get('url'), {}),
          createGroup(app.get('url'), {})
        ]);
      })
      .then(() => {
        // get the new list of groups
        return superAgentGetPromise(
          `${app.get('url')}api/Groups?filter=${filter}`
        );
      })
      .then(groups => {
        expect(groups.length).toEqual(beforeBody.length + 3);
        done();
      })
      .catch(err => {
        expect(err).toNotExist('Promise should not result in error!');
        done();
      });
  });

  it('where parameter should be usable when using group_pop sort', done => {
    const groupName = `min mega seje gruppe! ${Date.now()}`;
    const filter = encodeURIComponent(
      JSON.stringify({
        order: 'group_pop DESC',
        where: {name: groupName}
      })
    );
    createGroup(app.get('url'), {name: groupName})
      .then(group => {
        expect(group.name).toEqual(groupName);
        return superAgentGetPromise(
          `${app.get('url')}api/Groups?filter=${filter}`
        );
      })
      .then(groups => {
        expect(groups.length).toEqual(1);
        done();
      });
  });

  it('limit parameter should be usable when using group_pop sort', done => {
    const filter = encodeURIComponent(
      JSON.stringify({
        order: 'group_pop DESC',
        limit: 3
      })
    );

    Promise.all([
      createGroup(app.get('url'), {}),
      createGroup(app.get('url'), {}),
      createGroup(app.get('url'), {}),
      createGroup(app.get('url'), {}),
      createGroup(app.get('url'), {})
    ])
      .then(() => {
        return superAgentGetPromise(
          `${app.get('url')}api/Groups?filter=${filter}`
        );
      })
      .then(groups => {
        expect(groups.length).toEqual(3);
        done();
      });
  });
});
