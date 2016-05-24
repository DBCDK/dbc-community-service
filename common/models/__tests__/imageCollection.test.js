'use strict';

process.env.TESTING = true;

import fs from 'fs';
import expect from 'expect';
import superagent from 'superagent';
import app from '../../../server/server';

describe('Test imageCollection endpoints and functionality', () => {
  let server;

  beforeEach((done) => {
    server = app.listen(done);
  });

  afterEach((done) => {
    server.close(done);
  });

  it('should respond with an array', (done) => {
    superagent
      .get(`${app.get('url')}api/ImageCollections`)
      .set('Accept', 'application/json')
      .end((err, res) => {
        expect(err).toNotExist();
        expect(Array.isArray(res.body)).toExist();
        done();
      });
  });

  it('should create transcoding jobs when image is uploaded.', (done) => {
    // Mock file upload method to prevet data leaks and stabilize tests.
    const _fileUpload = app.models.file.upload;
    app.models.file.upload = (ctx, options, container, cb) => {
      cb(null, {id: 1});
    };

    // Mock image scaling queue to check that jobs are created
    const imageQueueMock = {add: expect.createSpy()};
    const _imageQueue = app.get('imageQueue');
    app.set('imageQueue', imageQueueMock);

    superagent
      .post(`${app.get('url')}api/ImageCollections/upload?container=uxdev-biblo-imagebucket`)
      .attach('file', fs.readFileSync(`${__dirname}/../__mocks__/1by1.png`), `test_file_${Date.now()}.png`)
      .end((err) => {
        expect(err).toNotExist();

        // we create six resolutions, therefore the imageQueue should be called six times.
        expect(imageQueueMock.add.calls.length).toEqual(7);

        // cleanup
        app.models.file.upload = _fileUpload;
        app.set('imageQueue', _imageQueue);
        done();
      });
  });
});
