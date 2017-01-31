/**
 * @file: This file implements a IMAP email client to receive scanning results from virusTotal.
 */

import Imap from 'imap';
import {parseScanResult} from './virusScan.parser';

export function setupMailbox(app, config) {
  const mailConfig = config.get('Email.IMAP');
  const logger = app.get('logger');
  const scannedItemQueue = app.get('scannedItemQueue');
  const imap = new Imap(mailConfig);

  const email = config.get('Email.email');
  const virusTotalEmail = config.get('Email.virusTotal');

  function parseInbox() {
    imap.search(['UNSEEN', ['FROM', 'scan@virustotal.com'], ['SUBJECT', '[VirusTotal] Server notification']], function(err, results) {
      if (err) {
        return logger.error('Could not search the inbox!');
      }

      // No new messages
      if (results.length < 1) {
        return results;
      }

      // Fetch the messages and mark them as read
      const f = imap.fetch(results, {
        bodies: ['HEADER.FIELDS (FROM TO SUBJECT)', 'TEXT'],
        struct: true,
        markSeen: true
      });

      // Parse the message buffers
      f.on('message', function(msg) {
        let headers;
        let body;
        let done = 0;

        function messageEnded() {
          if (done < 1) {
            done = 1;
            return done;
          }

          // Check the headers to ensure everything is A-OK!
          if (
            headers.from && (headers.from[0] === virusTotalEmail || headers.from[0] === `<${virusTotalEmail}>`) &&
            headers.subject && headers.subject[0] === '[VirusTotal] Server notification' &&
            headers.to && (headers.to[0] === email || headers.to[0] === `<${email}>`)
          ) {
            logger.info('Found report from virus total in inbox!');
            const lines = body.split('\r\n');
            lines.splice(0, 5);
            lines.splice(lines.length - 3, 3);
            parseScanResult(lines.join('\n')).then(res => {
              // Done scanning
              // Time to save the results
              scannedItemQueue.add(res);
            });
          }
        }

        msg.on('body', stream => {
          let data = '';
          stream.on('data', chunk => data += chunk); // eslint-disable-line no-return-assign
          stream.on('end', () => {
            const mailHeaders = Imap.parseHeader(data);
            if (mailHeaders.from) {
              headers = mailHeaders;
            }
            else {
              body = data;
            }

            messageEnded();
          });
        });
      });
    });
  }

  function checkMail() {
    imap.openBox('INBOX', false, function (err) {
      if (err) {
        logger.error('Could not read inbox, the virus scanning will not work!');
        return err;
      }

      return parseInbox();
    });
  }

  imap.once('ready', () => {
    checkMail();
    setInterval(checkMail, 1 * 60 * 1000);
  });

  imap.connect();
}
