import app from '../server';

if (!process.env.MIGRATING) {
  // eslint-disable-line
  const CampaignWorktype = app.models.CampaignWorktype;

  CampaignWorktype.upsert({
    id: 1,
    worktype: 'book'
  });

  CampaignWorktype.upsert({
    id: 2,
    worktype: 'article'
  });

  CampaignWorktype.upsert({
    id: 3,
    worktype: 'music'
  });

  CampaignWorktype.upsert({
    id: 4,
    worktype: 'other'
  });

  CampaignWorktype.upsert({
    id: 5,
    worktype: 'sheetmusic'
  });

  CampaignWorktype.upsert({
    id: 6,
    worktype: 'movie'
  });

  CampaignWorktype.upsert({
    id: 7,
    worktype: 'audiobook'
  });

  CampaignWorktype.upsert({
    id: 8,
    worktype: 'periodica'
  });

  CampaignWorktype.upsert({
    id: 9,
    worktype: 'game'
  });

  CampaignWorktype.upsert({
    id: 10,
    worktype: 'literature'
  });

  CampaignWorktype.upsert({
    id: 11,
    worktype: 'none'
  });

  CampaignWorktype.upsert({
    id: 12,
    worktype: 'map'
  });

  CampaignWorktype.upsert({
    id: 13,
    worktype: 'analysis'
  });
}
