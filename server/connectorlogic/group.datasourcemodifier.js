module.exports = function groupDatasourceModifier(app) {
  let Group = app.models.Group;
  let connector = Group.getDataSource().connector;

  // ranking parameters
  const timefactor = process.env.group_ranking_tf1 || '3 weeks'; // eslint-ignore-line no-process-env
  const followerTimefactor = process.env.group_ranking_tf2 || '2 months'; // eslint-ignore-line no-process-env
  const postfactor = process.env.group_ranking_pf || 200; // eslint-ignore-line no-process-env
  const followerfactor = process.env.group_ranking_ff || 100; // eslint-ignore-line no-process-env
  const commentfactor = process.env.group_ranking_cf || 100; // eslint-ignore-line no-process-env
  const likefactor = process.env.group_ranking_lf || 150; // eslint-ignore-line no-process-env

  connector.observe('before execute', (ctx, next) => {
    const group_pop_ordering = /ORDER BY "group_pop" (ASC|DESC)/.exec(
      ctx.req.sql
    );

    // Ranking behavior starts here
    if (group_pop_ordering && group_pop_ordering[1]) {
      const limit_parameter = /LIMIT ([0-9]+)$/.exec(ctx.req.sql);
      const limit = limit_parameter ? `LIMIT ${limit_parameter[1]}` : '';
      const where_parameter = /WHERE (.*) ORDER BY/.exec(ctx.req.sql);
      let where = '';
      if (where_parameter && where_parameter[1]) {
        where =
          'WHERE ' +
          where_parameter[1]
            .split(' ')
            .map(where_param => {
              where_param = where_param.split('=');
              where_param[0] = 'g.' + where_param[0];
              return where_param.join('=');
            })
            .join(' ');
      }

      ctx.req.sql =
        '' +
        'SELECT ' +
        '  g.id, ' +
        '  g.name, ' +
        '  g.description, ' +
        '  g.colour, ' +
        '  g.timecreated, ' +
        '  g.groupownerid, ' +
        '  ROUND(' +
        '  (' +
        `    COUNT(DISTINCT gp.id) * ${followerfactor} +` +
        `    COUNT(DISTINCT pl.id) * ${likefactor} +` +
        `    COUNT(DISTINCT p.id) * ${postfactor} +` +
        `    COUNT(DISTINCT c.id) * ${commentfactor}` +
        '  ) / (' +
        '    log(EXTRACT(EPOCH FROM now()) - EXTRACT(EPOCH FROM g.timecreated))' +
        '  )) AS pop ' +
        'FROM ' +
        '  "group" g ' +
        '  LEFT JOIN "groupprofile" gp ' +
        `    ON g.id=gp.groupid  AND gp.visited >= date_trunc('day', NOW() - interval '${followerTimefactor}')` +
        '  LEFT JOIN post p ' +
        `    ON g.id=p.groupid AND p.timecreated >= date_trunc('day', NOW() - interval '${timefactor}')` +
        '  LEFT JOIN "comment" c ' +
        `    ON c.postid=p.id AND c.timecreated >= date_trunc('day', NOW() - interval '${timefactor}')` +
        '  LEFT JOIN postlike pl' +
        '    ON pl.postid=p.id' +
        ` ${where} ` +
        'GROUP BY ' +
        '  g.id ' +
        'ORDER BY ' +
        `  pop ${group_pop_ordering[1]}, ` + // Order by direction.
        '  g.timecreated DESC ' +
        `${limit} `;
    }
    next();
  });
};
