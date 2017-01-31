process.env.TESTING = true;

import expect from 'expect';
import fs from 'fs';
import {parseScanResult} from '../virusScan.parser';

describe('Test the virusScan parser', () => {
  it('should return an error when parsing invalid results', done => {
    const mockXml = '<?xml version="1.0" encoding="iso-8859-1"?><_root_></_root_>';
    parseScanResult(mockXml)
      .then(response => {
        // It should've thrown an error!
        expect(response).toNotExist();
        done();
      })
      .catch(error => {
        expect(error).toEqual('Could not parse the received XML!');
        done();
      });
  });

  it('should parse an infected scan', () => {
    const mockXml = fs.readFileSync(`${__dirname}/../__mocks__/infected_scan_result`);
    return parseScanResult(mockXml).then(scanResult => {
      expect(typeof scanResult).toEqual(typeof {});
      expect(scanResult).toIncludeKeys(['detects', 'filename', 'detectTypes']);

      expect(scanResult.detects).toEqual(3);
      expect(scanResult.filename).toEqual('1484830463929_profile_1.pdf');
      expect(scanResult.detectTypes).toInclude('SCRIPT.Virus');
      expect(scanResult.detectTypes).toInclude('Artemis');
      expect(scanResult.detectTypes).toInclude('Win32/Trojan.Exploit.640');
    });
  });

  it('should parse a clean scan', () => {
    const mockXml = fs.readFileSync(`${__dirname}/../__mocks__/clean_scan_result`);
    return parseScanResult(mockXml).then(scanResult => {
      expect(typeof scanResult).toEqual(typeof {});
      expect(scanResult).toIncludeKeys(['detects', 'filename', 'detectTypes']);

      expect(scanResult.detects).toEqual(0);
      expect(scanResult.filename).toEqual('1484830176254_profile_1.pdf');
    });
  });

  it('should parse a scan with query params in filename', () => {
    const mockXml = `<?xml version="1.0" encoding="iso-8859-1"?>
<_root_>
<_metadata_>
<_filename_>1484830463929_profile_1.pdf?lala=haha</_filename_>
<_filesize_>95</_filesize_>
<_md5_>ac4841f0f7a1ff81fd9f47c6bd9dd54f</_md5_>
<_sha1_>60d5ed64078564eeb50f40cb8cdcd388d4f5a997</_sha1_>
<_sha256_>224e8914189a4028fe9aeb0be72133eb4204dcab458991bc5356cc27c8779b5c</_sha256_>
<_ssdeep_>3:oKRnK1ECXbxwPxLKvCigoHHCMeaL:oKRnLCLmuCfaL</_ssdeep_>
<_date_>01/19/2017 13:54:50 (CET)</_date_>
</_metadata_>
<_result_>
<_scan_>
<_engine_>ALYac</_engine_>
<_version_>1.0.1.9</_version_>
<_date_>20170119</_date_>
<_response_>-</_response_>
</_scan_>
</_result_>
</_root_>`;

    return parseScanResult(mockXml).then(scanResult => {
      expect(typeof scanResult).toEqual(typeof {});
      expect(scanResult).toIncludeKeys(['detects', 'filename', 'detectTypes']);

      expect(scanResult.detects).toEqual(0);
      expect(scanResult.filename).toEqual('1484830463929_profile_1.pdf');
    });
  });
});

