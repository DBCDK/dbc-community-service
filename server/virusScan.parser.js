/**
 * @file: This file contains the virus scan parser
 */

import {parseString} from 'xml2js';

const fileNameRegex = /<_filename_>(.+)<\/_filename_>/;

export function parseScanResult(xml) {
  return new Promise((resolve, reject) => {
    const result = {
      detects: 0,
      filename: '',
      detectTypes: []
    };

    xml = xml.toString();

    // The filename includes queryparams, we want to strip them out
    if (fileNameRegex.test(xml)) {
      const filename = (fileNameRegex.exec(xml)[1]).split('?')[0];
      xml = xml.replace(fileNameRegex, `<_filename_>${filename}</_filename_>`);
    }

    parseString(xml, function (err, parsed) {
      if (err) {
        return reject(err);
      }

      if (!(parsed._root_ && parsed._root_._result_ && parsed._root_._result_[0] && parsed._root_._result_[0]._scan_)) {
        return reject('Could not parse the received XML!');
      }

      if (!(parsed._root_._metadata_ && parsed._root_._metadata_[0] && parsed._root_._metadata_[0]._filename_ && parsed._root_._metadata_[0]._filename_[0])) {
        return reject('Could not parse the received XML!');
      }

      const flagsValid = true;
      const flags = parsed._root_._result_[0]._scan_.filter(scan => {
        if (!(scan._response_ && scan._response_[0])) {
          flagsValid = false;
          return false;
        }

        return scan._response_[0] !== '-';
      });

      if (!flagsValid) {
        return reject('Could not parse the received XML!');
      }

      result.detects = flags.length;
      result.detectTypes = flags.map(flag => flag._response_[0]);
      result.filename = parsed._root_._metadata_[0]._filename_[0];

      return resolve(result);
    });
  });
}
