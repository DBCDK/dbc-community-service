'use strict';

/**
 * @file Write a short description here.
 */

console.log('using production config');

module.exports = require('@dbcdk/dbc-config').profileservice.production || null;
