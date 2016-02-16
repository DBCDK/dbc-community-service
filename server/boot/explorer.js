'use strict';

module.exports = function mountLoopBackExplorer(server) {
  var explorer;
  try {
    explorer = require('loopback-component-explorer');
  }
  catch (err) {
    // Print the message only when the app was started via `server.listen()`.
    // Do not print any message when the project is used as a component.
    server.once('started', function(baseUrl) { // eslint-disable-line no-unused-vars
      console.log('Run `npm install loopback-component-explorer` to enable the LoopBack component explorer'); // eslint-disable-line no-console
    });
    return;
  }

  var restApiRoot = server.get('restApiRoot');

  var explorerApp = explorer.routes(server, {basePath: restApiRoot});
  server.use('/explorer', explorerApp);
  server.once('started', function() {
    var baseUrl = server.get('url').replace(/\/$/, '');
    var explorerPath = '/explorer';
    console.log('Browse your REST API at %s%s', baseUrl, explorerPath); // eslint-disable-line no-console
  });
};
