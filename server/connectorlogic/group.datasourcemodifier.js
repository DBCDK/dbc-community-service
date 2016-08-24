

module.exports = function groupDatasourceModifier(app) {
  let Group = app.models.Group;
  let connector = Group.getDataSource().connector;

  // ranking parameters
  const timefactor = process.env.group_ranking_tf1 || 40000; // eslint-ignore-line no-process-env
  const group_create_timefactor = process.env.group_ranking_tf2 || 45000; // eslint-ignore-line no-process-env
  const postfactor = process.env.group_ranking_pf || 2; // eslint-ignore-line no-process-env
  const followerfactor = process.env.group_ranking_ff || 5; // eslint-ignore-line no-process-env
  const commentfactor = process.env.group_ranking_cf || 2; // eslint-ignore-line no-process-env
  const likefactor = process.env.group_ranking_lf || 2; // eslint-ignore-line no-process-env

  connector.observe('before execute', (ctx, next) => {
    const group_pop_ordering = /ORDER BY "group_pop" (ASC|DESC)/.exec(ctx.req.sql);

    // Ranking behavior starts here
    if (group_pop_ordering && group_pop_ordering[1]) {
      const limit_parameter = /LIMIT ([0-9]+)$/.exec(ctx.req.sql);
      const limit = limit_parameter ? `LIMIT ${limit_parameter[1]}` : '';
      const where_parameter = /WHERE (.*) ORDER BY/.exec(ctx.req.sql);
      let where = '';
      if (where_parameter && where_parameter[1]) {
        where = 'WHERE ' + where_parameter[1].split(' ').map((where_param) => {
          where_param = where_param.split('=');
          where_param[0] = 'g.' + where_param[0];
          return where_param.join('=');
        }).join(' ');
      }

      ctx.req.sql = '' +
        'SELECT ' +
        '  g.id, ' +
        '  g.name, ' +
        '  g.description, ' +
        '  g.colour, ' +
        '  g.timecreated, ' +
        '  g.groupownerid, ' +
        `(EXTRACT(EPOCH FROM MAX(g.timecreated))/${group_create_timefactor}) *` +
        `(COUNT(DISTINCT gp.id)*${followerfactor}) +` +
        '(' +
        `  COUNT(DISTINCT pl.id) * ${likefactor} +` +
        `  COUNT(DISTINCT p.id) * ${postfactor} +` +
        `  COUNT(DISTINCT c.id) * ${commentfactor}` +
        ') *' +
        '(GREATEST(' +
        '  EXTRACT(EPOCH FROM MAX(p.timecreated)),' +
        '  EXTRACT(EPOCH FROM MAX(c.timecreated)),' +
        '  1461568281' +
        `) / ${timefactor}) as pop ` +
        'FROM ' +
        '  "group" g ' +
        '  JOIN "groupprofile" gp ' +
        '    ON g.id=gp.groupid ' +
        '  LEFT JOIN post p ' +
        '    ON g.id=p.groupid ' +
        '  LEFT JOIN "comment" c ' +
        '    ON c.postid=p.id ' +
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
