#!/usr/bin/env node
const superagent = require('superagent');
const fs = require('fs');



const csEndPointIndex = process.argv.indexOf('--cs-endpoint');
const csEndPoint = process.argv[csEndPointIndex+1];

const opEndPointIndex = process.argv.indexOf('--op-endpoint');
const opEndPoint = process.argv[opEndPointIndex+1];

const tokenIndex = process.argv.indexOf('--token');
const token = process.argv[tokenIndex+1];

const LOG_FILE = 'add-genres-subjects-to-existing-reviews.log';

if (!csEndPoint || !opEndPoint || !token) {
  throw new Error('Missing some argument. Need values for --cs-endpoint, --op-endpoint, and --token');
}

superagent.get(`${csEndPoint}/api/reviews`).end(async (error, reviews) => {
  if(error) {
    console.error(error);
    throw new Error('could not fetch reviews');
  }
  console.log(`Processing ${reviews.body.length} reviews`);
  let numProcessed = 0;

  for(let i = 0; i < reviews.body.length; i++) {

    const review = reviews.body[i];
    try {
      const workResult = (await superagent
        .get(`${opEndPoint}/v1/work`)
        .query({pids: JSON.stringify([review.pid]), fields:['subjectDBCS', 'subjectGenre'], access_token: token})).body.data;

      if (!workResult || workResult.length === 0) {
        fs.appendFileSync(LOG_FILE, `Could not match work to review.id=${review.id}, review.pid=${review.pid}`);
        console.log(`Could not match work to review.id=${review.id}, review.pid=${review.pid}`);
      } else {
        const work = workResult[0];
        const subjects = work.subjectDBCS;
        const genres = work.subjectGenre;
        if (subjects && subjects.length > 0) {
          await superagent.post(`${csEndPoint}/api/reviews/addSubject`)
            .query({subject: subjects.join(','), reviewId: review.id});
        }
        if (genres && genres.length > 0) {
          await superagent.post(`${csEndPoint}/api/reviews/addGenre`)
            .query({genre: genres.join(','), reviewId: review.id});
        }
        numProcessed++;
      }
    } catch(err) {
      fs.appendFileSync(LOG_FILE, `Some error occurred. review.id=${review.id}, review.pid=${review.pid}`);
      console.log(`Some error occurred. review.id=${review.id}, review.pid=${review.pid}`, err);
    }
  }
  console.log(`Processed ${numProcessed} reviews`);
});
