#!/usr/bin/env node

/**
 * A script which fetches all posts in a group
 * and outputs a document which is useful for 500 word campaign
 */
const superagent = require('superagent');

const csEndPointIndex = process.argv.indexOf('--cs-endpoint');
const csEndPoint = process.argv[csEndPointIndex + 1];
const groupIdIndex = process.argv.indexOf('--group-id');
const groupId = process.argv[groupIdIndex + 1];

if (csEndPointIndex === -1) {
  console.log('Missing some argument. Need value for --cs-endpoint');
  process.exit(1);
}
if (groupIdIndex === -1) {
  console.log('Missing some argument. Need value for --group-id');
  process.exit(1);
}

const writePost = post => {
  console.log(`Indlæg: ${post.id}`);
  console.log(`Navn: ${post.owner.fullName}`);
  console.log(`Brugernavn: ${post.owner.displayName}`);
  console.log(`BrugerId: ${post.postownerid}`);
  console.log(`Oprettet: ${post.timeCreated}`);
  console.log(`Antal ord: ${post.content.split(/\s+/).length}`);
  console.log(`Indhold:`);
  console.log(post.content);
  if (post.pdf) {
    console.log(`PDF: https://biblo.dk/pdf/${post.id}`);
    console.log('');
  }
  console.log('--------------------------------------------------');
  console.log();
};

const doWork = async () => {
  const response = await superagent
    .get(`${csEndPoint}/api/Groups/${groupId}/posts`)
    .query({filter: {include: ['pdf', 'owner']}});

  const posts = response.body;
  posts.forEach(p => {
    writePost(p);
  });
};

doWork();
