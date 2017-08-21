

process.env.TESTING = true;

import expect from 'expect';
import superagent from 'superagent';
import app from '../../../server/server';

describe('Test post endpoints and functionality', () => {
  let server;

  beforeEach((done) => {
    server = app.listen(done);
  });

  afterEach((done) => {
    server.close(done);
  });

  it('should respond with an array', (done) => {
    superagent
      .get(`${app.get('url')}api/Posts`)
      .set('Accept', 'application/json')
      .end((err, res) => {
        expect(err).toNotExist();
        expect(Array.isArray(res.body)).toExist();
        done();
      });
  });

  it('liking and unliking post', async () => {

    async function countLikes() {
      return (await superagent
        .get(`${app.get('url')}api/Likes/count`)
        .set('Accept', 'application/json')).body.count;
    }

    // create post
    const createPostResponse = await superagent
      .post(`${app.get('url')}api/Posts`)
      .send({title: 'a post',
        content: 'some content',
        timeCreated: '2017-07-07T09:13:08.191Z',
        postownerid: 1,
        postcontainergroupid: 1})
      .set('Accept', 'application/json');

    // count likes before liking
    const countBeforeAdd = await countLikes();

    // like review with profile=1
    await superagent
      .post(`${app.get('url')}api/Posts/${createPostResponse.body.id}/likes`)
      .send({value: 1, profileId: 1})
      .set('Accept', 'application/json');

    // like review with profile=2
    await superagent
      .post(`${app.get('url')}api/Posts/${createPostResponse.body.id}/likes`)
      .send({value: 1, profileId: 2})
      .set('Accept', 'application/json');

    // count likes after liking
    const countAfterAdd = await countLikes();

    expect(countBeforeAdd + 2).toEqual(countAfterAdd);

    // unlike review with profile=2
    await superagent
      .del(`${app.get('url')}api/Posts/unlike`)
      .query({postId: createPostResponse.body.id, profileId: 2})
      .set('Accept', 'application/json');

    // count likes after liking
    const countAfterUnlike = await countLikes();

    expect(countAfterAdd - 1).toEqual(countAfterUnlike);
  });
});
