'use strict';

/**
 * @file: A collection of testutils for testing biblo.
 */

import superagent from 'superagent';
import crypto from 'crypto';

export function loginViaUnilogin(endpoint, username) {
  username = username || 'bobby';

  return (new Promise((resolve, reject) => {
    let uniloginSecret;

    if (process.env.UNILOGINSECRET) {
      uniloginSecret = process.env.UNILOGINSECRET;
    }
    else {
      uniloginSecret = require('@dbcdk/biblo-config').biblo.getConfig().unilogin.secret;
    }

    let timestamp = (new Date()).toISOString();
    let serverToken = crypto
      .createHash('md5')
      .update(timestamp + uniloginSecret + username)
      .digest('hex');

    superagent
      .post(`${endpoint}api/Profiles/unilogin`)
      .type('form')
      .send({
        username,
        timestamp,
        authtoken: serverToken,
        ttl: 0
      })
      .end((err, res) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(res.body);
        }
      });
  }));
}

export function createProfile(endpoint, userObject) {
  return (new Promise((resolve, reject) => {
    userObject = Object.assign({
      username: 'bobby',
      displayName: 'bobby',
      favoriteLibrary: {
        libraryId: '775100' // Århus
      },
      description: 'Dette er en beskrivelse af en bruger',
      email: 'bob@mailinator.com',
      phone: '+4588888888',
      created: '2016-03-28',
      lastUpdated: '2016-03-28',
      hasFilledInProfile: true,
      birthday: '2016-03-28',
      fullName: 'Bobby Bendsen'
    }, userObject || {});

    superagent
      .post(`${endpoint}api/Profiles`)
      .type('form')
      .send(userObject)
      .end((err, res) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(res.body);
        }
      });
  }));
}
