

process.env.TESTING = true;

import expect from 'expect';
import superagent from 'superagent';
import app from '../../../server/server';

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
    await superagent
      .post(`${app.get('url')}api/Reviews/addSubject`)
      .query({reviewId: createReviewResponse.body.id, subject: 'a' + Date.now()})
      .set('Accept', 'application/json');

    // count subjects after add
    const afterSubjectsCountResponse = await superagent
      .get(`${app.get('url')}api/BibliographicSubjects/count`)
      .set('Accept', 'application/json');

    expect(subjectsCountResponse.body.count + 1).toEqual(afterSubjectsCountResponse.body.count);
  });

  it('list of subjects created and added to review', async () => {

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
    await superagent
      .post(`${app.get('url')}api/Reviews/addSubject`)
      .query({reviewId: createReviewResponse.body.id, subject: 'a' + Date.now() + ',' + 'b' + Date.now()})
      .set('Accept', 'application/json');

    // count subjects after add
    const afterSubjectsCountResponse = await superagent
      .get(`${app.get('url')}api/BibliographicSubjects/count`)
      .set('Accept', 'application/json');

    expect(subjectsCountResponse.body.count + 2).toEqual(afterSubjectsCountResponse.body.count);
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
    .set('Accept', 'application/json');

    // count subjects
    const subjectsCountResponse = await superagent
      .get(`${app.get('url')}api/BibliographicSubjects/count`)
      .set('Accept', 'application/json');

    // add subject
    await superagent
      .post(`${app.get('url')}api/Reviews/addSubject`)
      .query({reviewId: createReviewResponse.body.id, subject: title})
      .set('Accept', 'application/json');

    // count subjects after add
    const afterSubjectsCountResponse = await superagent
      .get(`${app.get('url')}api/BibliographicSubjects/count`)
      .set('Accept', 'application/json');

    expect(subjectsCountResponse.body.count).toEqual(afterSubjectsCountResponse.body.count);

  });

  it('genre created and added to review', async () => {

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

    // count reviews before add
    const genresCountResponse = await superagent
      .get(`${app.get('url')}api/BibliographicGenres/count`)
      .set('Accept', 'application/json');

    // add subject
    await superagent
      .post(`${app.get('url')}api/Reviews/addGenre`)
      .query({reviewId: createReviewResponse.body.id, genre: 'a' + Date.now()})
      .set('Accept', 'application/json');

    // count subjects after add
    const afterGenresCountResponse = await superagent
      .get(`${app.get('url')}api/BibliographicGenres/count`)
      .set('Accept', 'application/json');

    expect(genresCountResponse.body.count + 1).toEqual(afterGenresCountResponse.body.count);
  });

  it('list of genres created and added to review', async () => {

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

    // count reviews before add
    const genresCountResponse = await superagent
      .get(`${app.get('url')}api/BibliographicGenres/count`)
      .set('Accept', 'application/json');

    // add subject
    await superagent
      .post(`${app.get('url')}api/Reviews/addGenre`)
      .query({reviewId: createReviewResponse.body.id, genre: 'a' + Date.now() + ',' + 'b' + Date.now()})
      .set('Accept', 'application/json');

    // count subjects after add
    const afterGenresCountResponse = await superagent
      .get(`${app.get('url')}api/BibliographicGenres/count`)
      .set('Accept', 'application/json');

    expect(genresCountResponse.body.count + 2).toEqual(afterGenresCountResponse.body.count);
  });

  it('liking and unliking review', async () => {

    async function countLikes() {
      return (await superagent
        .get(`${app.get('url')}api/Likes/count`)
        .set('Accept', 'application/json')).body.count;
    }

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

    // count likes before liking
    const countBeforeAdd = await countLikes();

    // like review with profile=1
    await superagent
      .post(`${app.get('url')}api/Reviews/${createReviewResponse.body.id}/likes`)
      .send({value: 1, profileId: 1})
      .set('Accept', 'application/json');

    // like review with profile=2
    await superagent
      .post(`${app.get('url')}api/Reviews/${createReviewResponse.body.id}/likes`)
      .send({value: 1, profileId: 2})
      .set('Accept', 'application/json');

    // count likes after liking
    const countAfterAdd = await countLikes();

    expect(countBeforeAdd + 2).toEqual(countAfterAdd);

    // unlike review with profile=2
    await superagent
      .del(`${app.get('url')}api/Reviews/unlike`)
      .query({reviewId: createReviewResponse.body.id, profileId: 2})
      .set('Accept', 'application/json');

    // count likes after liking
    const countAfterUnlike = await countLikes();

    expect(countAfterAdd - 1).toEqual(countAfterUnlike);
  });

});
