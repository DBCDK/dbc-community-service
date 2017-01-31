const Queue = require('bull');
const nodemailer = require('nodemailer');

module.exports = function createVirusScanningQueue(app, redisHost, redisPort, config, generateSignedCloudfrontUrl) {
  const logger = app.get('logger');
  const connectString = `redis://${redisHost}:${redisPort}`;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // The internal IMAP server for this setup runs self signed tls.
  const transport = nodemailer.createTransport(config.get('Email.transportString'));

  const virusQueue = Queue('virus_scanning', connectString, {});
  virusQueue.process(function (job, done) {
    logger.info('Starting virus scan');
    const pdfUrl = generateSignedCloudfrontUrl(
      `https://${config.get(`ServiceProvider.aws.cloudfrontUrls.${job.data.fileObj.container}`)}/${job.data.fileObj.name}`
    );

    const mailOptions = {
      from: `"BibloCS" <${config.get('Email.email')}>`,
      to: config.get('Email.virusTotal'),
      subject: 'SCAN+XML',
      text: '',
      attachments: [{
        filename: job.data.name,
        path: pdfUrl
      }]
    };

    transport.sendMail(mailOptions, (err, res) => {
      if (err) {
        logger.error('Error occurred while sending email! Check the transportString');
      }
      else {
        logger.info('Sent file to virus scanner!');
      }

      done(err, res);
    });
  });

  virusQueue.on('error', function(error) {
    logger.error('Got error in virus queue', error);
  });

  return virusQueue;
};
