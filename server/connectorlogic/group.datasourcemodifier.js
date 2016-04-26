'use strict';

module.exports = function groupDatasourceModifier(app) {
  let Group = app.models.Group;
  let connector = Group.getDataSource().connector;
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

      const timefactor = 2;
      const postfactor = 2;
      const followerfactor = 1;
      const commentfactor = 1;

      ctx.req.sql = '' +
        'SELECT ' +
        '  g.id, ' +
        '  g.name, ' +
        '  g.description, ' +
        '  g.colour, ' +
        '  g.timecreated, ' +
        '  g.groupownerid, ' +
        '  ROUND((GREATEST( ' +
        '    EXTRACT(EPOCH FROM MAX(p.timecreated)), ' +
        '    EXTRACT(EPOCH FROM MAX(c.timecreated)), ' +
        '    1461568281 ' +
        `  ) + EXTRACT(EPOCH FROM MAX(g.timecreated)))/(${timefactor}*45000) + ` +
        `  COUNT(distinct p.id)*${postfactor} +` +
        `  COUNT(distinct gp.id)*${followerfactor} +` +
        `  COUNT(DISTINCT c.id))*${commentfactor} as pop ` +
        'FROM ' +
        '  "group" g ' +
        '  JOIN "groupprofile" gp ' +
        '    ON g.id=gp.groupid ' +
        '  LEFT JOIN post p ' +
        '    ON g.id=p.groupid ' +
        '  LEFT JOIN "comment" c ' +
        '    ON c.postid=p.id ' +
        `${where} ` +
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
