/**
 * @file: A collection of testutils for testing biblo.
 */

import superagent from 'superagent';
import crypto from 'crypto';
import {config} from '@dbcdk/biblo-config';

export function superAgentGetPromise(url) {
  return new Promise((resolve, reject) => {
    superagent.get(url).end((err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res.body);
      }
    });
  });
}

export function superAgentPostPromise(url, payload) {
  return new Promise((resolve, reject) => {
    superagent
      .post(url)
      .type('form')
      .send(payload)
      .end((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.body);
        }
      });
  });
}

export function loginViaUnilogin(endpoint, username) {
  username = username || 'bobby';

  const uniloginSecret = config.get('UNILogin.secret');

  let timestamp = new Date().toISOString();
  let serverToken = crypto
    .createHash('md5')
    .update(timestamp + uniloginSecret + username)
    .digest('hex');

  return superAgentPostPromise(`${endpoint}api/Profiles/unilogin`, {
    username,
    timestamp,
    authtoken: serverToken,
    ttl: 0
  });
}

export function createProfile(endpoint, userObject) {
  userObject = Object.assign(
    {
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
    },
    userObject || {}
  );

  return superAgentPostPromise(`${endpoint}api/Profiles`, userObject);
}

export function createGroup(endpoint, groupObject) {
  groupObject = Object.assign(
    {
      name: `Gruppen! ${Date.now()}`,
      description: 'Dette er GRUPPEN!',
      colour: 'red',
      timeCreated: new Date().toUTCString(),
      markedAsDeleted: false
    },
    groupObject || {}
  );

  return superAgentPostPromise(`${endpoint}api/Groups`, groupObject);
}

export function createReview(endpoint, reviewObject) {
  const obj = Object.assign(
    {
      pid: '870970-basis:51342860',
      libraryid: '775100',
      worktype: 'literature',
      content: 'some content',
      created: '2017-07-07T09:13:08.191Z',
      modified: '2017-07-07T09:13:08.191Z',
      rating: 5,
      markedAsDeleted: false,
      reviewownerid: 0
    },
    reviewObject || {}
  );

  return superAgentPostPromise(`${endpoint}api/Reviews`, obj);
}
