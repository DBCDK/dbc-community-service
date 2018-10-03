process.env.TESTING = true;

import expect from 'expect';
import superagent from 'superagent';
import app from '../../../server/server';

describe('Test quiz endpoints and functionality', () => {
  let server;

  beforeEach(done => {
    server = app.listen(done);
  });

  afterEach(done => {
    server.close(done);
  });

  it('should respond with an array', done => {
    superagent
      .get(`${app.get('url')}api/QuizResults`)
      .set('Accept', 'application/json')
      .end((err, res) => {
        expect(err).toNotExist();
        expect(Array.isArray(res.body)).toExist();
        done();
      });
  });

  it('should be able to filter quizzes by quizId and ownerId', async () => {
    await superagent.post(`${app.get('url')}api/QuizResults`).send({
      quizId: 'quiz1',
      ownerId: 1,
      result: {some: 'result'}
    });
    await superagent.post(`${app.get('url')}api/QuizResults`).send({
      quizId: 'quiz1',
      ownerId: 2,
      result: {some: 'result'}
    });
    await superagent.post(`${app.get('url')}api/QuizResults`).send({
      quizId: 'quiz2',
      ownerId: 1,
      result: {some: 'result'}
    });

    const actual = (await superagent.get(
      `${app.get(
        'url'
      )}api/QuizResults?filter[where][quizId]=quiz1&filter[where][ownerId]=1`
    )).body;

    expect(actual.length).toBe(1);
  });
});
