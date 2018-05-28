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
