'use strict';

import app from '../server';

if (!process.env.MIGRATING) { // eslint-disable-line
  const CommunityRole = app.models.CommunityRole;

  CommunityRole.upsert({
    id: 1,
    name: 'member'
  });

  CommunityRole.upsert({
    id: 2,
    name: 'moderator'
  });
}
