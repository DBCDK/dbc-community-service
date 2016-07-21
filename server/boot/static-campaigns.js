'use strict';

import app from '../server';

const Campaign = app.models.Campaign;
const CampaignWorktype = app.models.CampaignWorktype;

// Add the first campaign statically to migrate from existing solution.
Campaign.upsert({
  id: 1,
  campaignName: 'Sommerbogen 2016',
  startDate: '2016-06-09T20:00:00.044Z',
  endDate: '2016-08-21T04:00:00.044Z',
  logos: {
    svg: '/sommerbogen-logo.svg',
    small: '/sommerbogen-logo.png',
    medium: '/sommerbogen-logo.png',
    large: '/sommerbogen-logo.png'
  },
  type: 'group'
}, (err, campaign) => {
  if (!err) {
    const staticWorktypes = {where: {or: [{worktype: 'book'}, {worktype: 'literature'}, {worktype: 'audiobook'}]}};
    CampaignWorktype.find(staticWorktypes, (error, worktypes) => {
      if (!error) {
        worktypes.forEach(worktype => {
          campaign.workTypes.add(worktype);
        });
      }
    });
  }
});
