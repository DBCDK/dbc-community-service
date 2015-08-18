'use strict';

/**
 * @file configurations that depend on deploy environment
 */


let profileServiceHost = '127.0.0.1';
let profileServicePort = '3000';

let pgHost = '127.0.0.1';
let pgPort = '8080';

const environment = process.env.NODE_ENV; // eslint-disable-line no-process-env

switch (environment) {
  case 'production':
    profileServiceHost = 'some-production-url';
    break;
  case 'development':
    profileServiceHost = 'http://uxscrum-i01.dbc.dk';
    pgHost = 'http://uxscrum-i01.dbc.dk';
    break;
  default:
    break;
}


module.exports.serviceUrl = profileServiceHost + ':' + profileServicePort;

module.exports.pgUrl = pgHost + ':' + pgPort;
