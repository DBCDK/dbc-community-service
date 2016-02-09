'use strict';

import app from '../server';

console.log('adding static roles');

const CommunityRole = app.models.CommunityRole;

CommunityRole.create({
  id: 1,
  name: 'member'
});

CommunityRole.create({
  id: 2,
  name: 'moderator'
});
