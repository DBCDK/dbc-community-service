'use strict';

/**
 * @file Write a short description here.
 */

console.log('using development config');

module.exports = require('@dbcdk/dbc-config').profileservice.development || null;

