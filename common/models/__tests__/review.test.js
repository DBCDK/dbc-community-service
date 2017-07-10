

process.env.TESTING = true;

import expect from 'expect';
import superagent from 'superagent';
import app from '../../../server/server';
import * as testutils from './testutils';

describe('Test review endpoints and functionality', () => {
  let server;

  beforeEach((done) => {
    server = app.listen(done);
  });

  afterEach((done) => {
    server.close(done);
  });

  it('should respond with an array', (done) => {
    superagent
      .get(`${app.get('url')}api/Reviews`)
      .set('Accept', 'application/json')
      .end((err, res) => {
        expect(err).toNotExist();
        expect(Array.isArray(res.body)).toExist();
        done();
      });
  });

  it('subject created and added to review', async () => {

    // create review
    const createReviewResponse = await superagent
      .post(`${app.get('url')}api/Reviews`)
      .send({pid: '870970-basis:51342860',
             libraryid: '775100',
             worktype: 'literature',
             content: 'some content',
             created: '2017-07-07T09:13:08.191Z',
             modified: '2017-07-07T09:13:08.191Z',
             rating: 5,
             markedAsDeleted: false,
             reviewownerid: 0})
      .set('Accept', 'application/json');

    // count subjects before add
    const subjectsCountResponse = await superagent
      .get(`${app.get('url')}api/BibliographicSubjects/count`)
      .set('Accept', 'application/json');

    // add subject
    const addSubjectResponse = await superagent
        .post(`${app.get('url')}api/Reviews/addSubject`)
        .query({reviewId: createReviewResponse.body.id, subject: 'a' + Date.now()})
        .set('Accept', 'application/json')

    // count subjects after add
    const afterSubjectsCountResponse = await superagent
      .get(`${app.get('url')}api/BibliographicSubjects/count`)
      .set('Accept', 'application/json')

    expect(subjectsCountResponse.body.count + 1).toEqual(afterSubjectsCountResponse.body.count);
  });

  it('subject not added when it exists', async () => {
    const title = 'b' + Date.now();

    // create review
    const createReviewResponse = await superagent
      .post(`${app.get('url')}api/Reviews`)
      .send({pid: '870970-basis:51342860',
             libraryid: '775100',
             worktype: 'literature',
             content: 'some content',
             created: '2017-07-07T09:13:08.191Z',
             modified: '2017-07-07T09:13:08.191Z',
             rating: 5,
             markedAsDeleted: false,
             reviewownerid: 1})
      .set('Accept', 'application/json');

    // add subjects
    await superagent
    .post(`${app.get('url')}api/BibliographicSubjects`)
    .send({title})
    .set('Accept', 'application/json')

    // count subjects
    const subjectsCountResponse = await superagent
      .get(`${app.get('url')}api/BibliographicSubjects/count`)
      .set('Accept', 'application/json');

    // add subject
    await superagent
      .post(`${app.get('url')}api/Reviews/addSubject`)
      .query({reviewId: createReviewResponse.body.id, subject: title})
      .set('Accept', 'application/json')

    // count subjects after add
    const afterSubjectsCountResponse = await superagent
      .get(`${app.get('url')}api/BibliographicSubjects/count`)
      .set('Accept', 'application/json')

    expect(subjectsCountResponse.body.count).toEqual(afterSubjectsCountResponse.body.count);

  });

});
