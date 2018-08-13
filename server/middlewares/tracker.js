import {log} from 'dbc-node-logger';

export default function tracker() {
  return (req, res, next) => {
    log.info('Request triggered', {
      params: req.params,
      query: req.query,
      url: req.url
    });
    var start = process.hrtime();
    res.once('finish', function() {
      var diff = process.hrtime(start);
      var timing = diff[0] * 1e3 + diff[1] * 1e-6;
      log.info(`Request done`, {
        timing,
        params: req.params,
        query: req.query,
        url: req.url
      });
    });
    next();
  };
}
