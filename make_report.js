#!/usr/bin/env node

/**
 * A script which fetches all reviews from community service and makes
 * csv files containing statistics for how subjects and genres are distributed
 * across works
 */
const superagent = require('superagent');
const fs = require('fs');

const csEndPointIndex = process.argv.indexOf('--cs-endpoint');
const csEndPoint = process.argv[csEndPointIndex + 1];

if (csEndPointIndex === -1) {
  console.log('Missing some argument. Need value for --cs-endpoint');
  process.exit(1);
}

const CHUNK_SIZE = 1000;
const OUTPUT_FOLDER = 'report';

const fetchReviews = async () => {
  let result = [];
  let i = 0;
  while (true) {
    const response = await superagent.get(`${csEndPoint}/api/reviews/`).query({
      filter: JSON.stringify({
        limit: CHUNK_SIZE,
        skip: CHUNK_SIZE * i,
        include: ['genres', 'subjects']
      })
    });
    if (response.body.length === 0) {
      break;
    }
    result = [...result, ...response.body];
    i++;
    console.log(`fetched ${result.length} reviews`);
  }
  console.log('done fetching reviews');
  return result;
};

const doWork = async () => {
  if (!fs.existsSync(OUTPUT_FOLDER)) {
    fs.mkdirSync(OUTPUT_FOLDER);
  }
  const reviews = await fetchReviews();
  fs.writeFileSync(
    `${OUTPUT_FOLDER}/reviews.json`,
    JSON.stringify(reviews, null, 2)
  );
  const worksMap = {};
  reviews.forEach(review => {
    worksMap[review.pid] = {
      pid: review.pid,
      worktype: review.worktype,
      genres: review.genres,
      subjects: review.subjects
    };
  });
  fs.writeFileSync(
    `${OUTPUT_FOLDER}/works.json`,
    JSON.stringify(Object.values(worksMap), null, 2)
  );
  fs.writeFileSync(
    `${OUTPUT_FOLDER}/works.csv`,
    'pid,work_type,genres,subjects\n' +
      Object.values(worksMap)
        .map(
          work =>
            work.pid +
            ',' +
            work.worktype +
            ',' +
            work.genres.map(w => w.title).join('_') +
            ',' +
            work.subjects.map(s => s.title).join('_')
        )
        .join('\n')
  );

  const genres = {};
  const subjects = {};
  Object.values(worksMap).forEach(work => {
    work.genres.forEach(genre => {
      let g = genres[genre.title];
      if (!g) {
        g = {title: genre.title, workCount: 0};
        genres[genre.title] = g;
      }
      g.workCount++;
    });
    work.subjects.forEach(subject => {
      let s = subjects[subject.title];
      if (!s) {
        s = {title: subject.title, workCount: 0};
        subjects[subject.title] = s;
      }
      s.workCount++;
    });
  });
  fs.writeFileSync(
    `${OUTPUT_FOLDER}/genres.json`,
    JSON.stringify(Object.values(genres), null, 2)
  );
  fs.writeFileSync(
    `${OUTPUT_FOLDER}/subjects.json`,
    JSON.stringify(Object.values(subjects), null, 2)
  );

  fs.writeFileSync(
    `${OUTPUT_FOLDER}/genres.csv`,
    'genre,work_count\n' +
      Object.values(genres)
        .sort((g1, g2) => g2.workCount - g1.workCount)
        .map(genre => genre.title + ',' + genre.workCount)
        .join('\n')
  );
  fs.writeFileSync(
    `${OUTPUT_FOLDER}/subjects.csv`,
    'subject,work_count\n' +
      Object.values(subjects)
        .sort((s1, s2) => s2.workCount - s1.workCount)
        .map(subject => subject.title + ',' + subject.workCount)
        .join('\n')
  );
};

doWork();
