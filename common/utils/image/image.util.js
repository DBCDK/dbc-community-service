'use strict';

/**
 * @file Utility functions for working with images
 */


var fs = require('fs');
var mimeTypes = require('./mimetypes');
var crypto = require('crypto');


module.exports = function convertDataUrlToFile(dataUrl) {

  var parts = dataUrl.split(',');

  // dataUrl looks like this:
  // data:[<mediatype>][;base64],<data>
  var head = parts[0];
  var data = parts[1];

  // create an MD5 hash of the data
  var hash = crypto.createHash('md5').update(data).digest('hex');

  var mimeType = head.split(':')[1].split(';')[0];

  // find the correct file suffix
  var fileSuffix;
  if (mimeType in mimeTypes) {
    fileSuffix = mimeTypes[mimeType];
  }
  else {
    throw Error();
  }

  var filePath = hash + fileSuffix;

  // decode the base64 string
  var buf = new Buffer(data, 'base64');
  // write to given filepath
  fs.writeFile(filePath, buf, function(err) {
    if (err) {
      throw Error('could not write to file');
    }
  });
};
