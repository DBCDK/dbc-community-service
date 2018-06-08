import config from './config.utils';
import crypto from 'crypto';

/**
 * Get hashed version of username.
 * @param {String} username
 */
export function hashUsername(username) {
  return crypto
    .createHmac('sha256', config.get('CommunityService.secret'))
    .update(username)
    .digest('hex');
}

/**
 * Encrypt object
 * @param {String} data
 */
export function encryptData(data) {
  const cipher = crypto.createCipher('aes-128-cbc', config.get('Biblo.secret'));
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}
