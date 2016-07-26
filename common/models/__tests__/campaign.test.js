

process.env.TESTING = true;

import expect from 'expect';
import superagent from 'superagent';
import app from '../../../server/server';

describe('Test Campaign model and logic', () => {
  let server;

  beforeEach((done) => {
    server = app.listen(done);
  });

  afterEach((done) => {
    server.close(done);
  });

  it('Should return an array of Campaigns on GET', done => {
    superagent
      .get(app.get('url') + 'api/Campaigns')
      .set('Accept', 'application/json')
      .end((err, res) => {
        expect(Array.isArray(res.body)).toExist();
        expect(err).toNotExist('Make sure empty request doesn\'t produce error.'); // expect value to be falsy, ie. unset.
        done();
      });
  });

  it('Small, medium, large and SVG logos should be required', done => superagent
    .post(`${app.get('url')}api/Campaigns`)
    .set('Accept', 'application/json')
    .send({
      campaignName: 'testKampagne',
      startDate: '2016-07-20',
      endDate: '2016-07-21',
      logos: {},
      type: 'review'
    })
    .end(err => {
      expect(err).toExist();
      expect(err.status).toEqual(422);
      expect(err.response.body.error.message)
        .toEqual('The `Campaign` instance is not valid. Details: `logos` Logos must define small, medium, large and SVG. The logos must be URLs. (value: {}).');
      done();
    }));

  it('should still throw error if just one logo size is missing', done => superagent
    .post(`${app.get('url')}api/Campaigns`)
    .set('Accept', 'application/json')
    .send({
      campaignName: 'testKampagne',
      startDate: '2016-07-20',
      endDate: '2016-07-21',
      logos: {
        small: 'http://hep.com/dollar-small.png',
        medium: 'http://hep.com/dollar-medium.png',
        large: 'http://hep.com/dollar-large.png'
      },
      type: 'review'
    })
    .end(err => {
      expect(err).toExist();
      expect(err.status).toEqual(422);
      expect(err.response.body.error.message)
        .toEqual('The `Campaign` instance is not valid. Details: `logos` Logos must define small, medium, large and SVG. The logos must be URLs. (value: { small: \'http://hep.com/d... }).'); // eslint-disable-line
      done();
    }));

  it('should throw an error if type is invalid', done => superagent
    .post(`${app.get('url')}api/Campaigns`)
    .set('Accept', 'application/json')
    .send({
      campaignName: 'testKampagne',
      startDate: '2016-07-20',
      endDate: '2016-07-21',
      logos: {
        small: 'http://hep.com/dollar-small.png',
        medium: 'http://hep.com/dollar-medium.png',
        large: 'http://hep.com/dollar-large.png',
        svg: 'http://hep.com/dollar.svg'
      },
      type: 'invalid type'
    })
    .end(err => {
      expect(err).toExist();
      expect(err.status).toEqual(422);
      expect(err.response.body.error.message)
        .toEqual('The `Campaign` instance is not valid. Details: `type` We only support the following types: group, review (value: "invalid type").');
      done();
    }));

  it('should throw an error if startDate is after endDate', done => superagent
    .post(`${app.get('url')}api/Campaigns`)
    .set('Accept', 'application/json')
    .send({
      campaignName: 'testKampagne',
      startDate: '2016-07-21',
      endDate: '2016-07-20',
      logos: {
        small: 'http://hep.com/dollar-small.png',
        medium: 'http://hep.com/dollar-medium.png',
        large: 'http://hep.com/dollar-large.png',
        svg: 'http://hep.com/dollar.svg'
      },
      type: 'review'
    })
    .end(err => {
      expect(err).toExist();
      expect(err.status).toEqual(422);
      expect(err.response.body.error.message)
        .toEqual('The `Campaign` instance is not valid. Details: `startDate` Start date must be earlier than end date! (value: 2016-07-21T00:00:00.000Z).');
      done();
    }));

  it('should create a review campaign when valid parameters are sent', done => superagent
    .post(`${app.get('url')}api/Campaigns`)
    .set('Accept', 'application/json')
    .send({
      campaignName: 'testKampagne',
      startDate: '2016-07-20',
      endDate: '2016-07-21',
      logos: {
        small: 'http://hep.com/dollar-small.png',
        medium: 'http://hep.com/dollar-medium.png',
        large: 'http://hep.com/dollar-large.png',
        svg: 'http://hep.com/dollar.svg'
      },
      type: 'review'
    })
    .end((err, res) => {
      expect(err).toNotExist();
      expect(res.status).toEqual(200);
      expect(typeof res.body.id).toEqual('number');
      done();
    }));

  it('should create a group campaign when valid parameters are sent', done => superagent
    .post(`${app.get('url')}api/Campaigns`)
    .set('Accept', 'application/json')
    .send({
      campaignName: 'testKampagne',
      startDate: '2016-07-20',
      endDate: '2016-07-21',
      logos: {
        small: 'http://hep.com/dollar-small.png',
        medium: 'http://hep.com/dollar-medium.png',
        large: 'http://hep.com/dollar-large.png',
        svg: 'http://hep.com/dollar.svg'
      },
      type: 'group'
    })
    .end((err, res) => {
      expect(err).toNotExist();
      expect(res.status).toEqual(200);
      expect(typeof res.body.id).toEqual('number');
      done();
    }));
});
