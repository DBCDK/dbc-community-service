import {log as logger} from 'dbc-node-logger';
import app from '../server';
import {
  generateDownIndexes,
  getAddedColoumnsToDrop,
  getColoumnsToRestore,
  getModifiedColoumnsToRevert,
  indexSqlGenerator
} from './migration.utils';

function generateIndexes(postgres, model, actualIndexes, sql, downSql) {
  let indexSql = indexSqlGenerator(postgres, model, actualIndexes);
  if (indexSql && indexSql.length > 0) {
    sql.push(indexSql);
  }

  let indexDownSql = generateDownIndexes(postgres, model, actualIndexes);
  if (indexDownSql && indexDownSql.length > 0) {
    downSql.push(indexDownSql);
  }

  return {sql, downSql};
}

function generateMigrationSql(postgres, actualFields, actualIndexes, model) {
  let sql = [];
  let downSql = [];

  // Model already exists, start generating a migration
  // Start by adding the new coloumns
  sql = sql.concat(
    postgres.getColumnsToAdd(model, actualFields).map(colSql => {
      return `ALTER TABLE ${postgres.tableEscaped(model)} ${colSql}`;
    })
  );
  downSql = downSql.concat(
    getAddedColoumnsToDrop(postgres, model, actualFields)
  );

  // Next modify existing properties
  let tSql = [];
  postgres.getPropertiesToModify(model, actualFields).forEach(colsSql => {
    colsSql.split(',').forEach(colSql => {
      tSql.push(colSql);
    });
  });

  // Get columns to alter
  sql = sql.concat(
    tSql.map(colSql => {
      colSql = colSql.replace('ALTER COLUMN"', 'ALTER COLUMN "').split(','); // Temporary fix until PR #137 on the connector is merged.
      return `ALTER TABLE ${postgres.tableEscaped(model)} ${colSql}`;
    })
  );
  downSql = downSql.concat(
    getModifiedColoumnsToRevert(postgres, model, actualFields)
  );

  // Then drop unneeded coloumns
  sql = sql.concat(
    postgres.getColumnsToDrop(model, actualFields).map(colSql => {
      return `ALTER TABLE ${postgres.tableEscaped(model)} ${colSql}`;
    })
  );
  downSql = downSql.concat(getColoumnsToRestore(postgres, model, actualFields));

  // Finally add indexes
  return generateIndexes(postgres, model, actualIndexes, sql, downSql);
}

function generateCreateSql(postgres, model) {
  let sql = [];
  let downSql = [];

  // Model does not exist, create it!
  let name = postgres.tableEscaped(model);

  // Create table
  sql.push(`CREATE TABLE ${name} (\n  ${postgres.propertiesSQL(model)}\n)`);
  downSql.push(`DROP TABLE ${name}`);

  // Create indexes
  return generateIndexes(postgres, model, null, sql, downSql);
}

function outputSql(sql, downSql) {
  if (sql.length > 0) {
    logger.debug('==========================UP==========================');
    sql.forEach(sqlStatements => {
      sqlStatements.split(', ').forEach(statement => {
        logger.debug(`\n${statement};`);
      });
    });
  }

  if (downSql.length > 0) {
    logger.debug('=========================DOWN=========================');
    downSql.forEach(sqlStatements => {
      sqlStatements.split(', ').forEach(statement => {
        logger.debug(`\n${statement};`);
      });
    });
  }
}

function migrateTables(ds, appModels) {
  if (typeof appModels === 'string') {
    appModels = [appModels];
  }

  let postgres = ds.connector;
  appModels = appModels || Object.keys(postgres._models);
  appModels.forEach(appModel => {
    if (!(appModel in postgres._models)) {
      throw new Error(`Could not find model: ${appModel}`);
    }
  });

  // Get down to generating sql!
  appModels.forEach(model => {
    postgres.getTableStatus(model, (err, actualFields, actualIndexes) => {
      let sqlObject = {sql: [], downSql: []};
      if (!err && actualFields.length) {
        sqlObject = generateMigrationSql(
          postgres,
          actualFields,
          actualIndexes,
          model
        );
      } else {
        sqlObject = generateCreateSql(postgres, model);
      }

      if (!process.env.TESTING) {
        outputSql(sqlObject.sql, sqlObject.downSql);
      }
    });
  });
}

module.exports = function automigrate(model, cb) {
  let ds = app.dataSources.PsqlDs;
  if (process.env.TESTING) {
    // When testing, we use a memory database, therefore we can just autoupdate it.
    ds.autoupdate();
  } else if (!process.env.MIGRATING) {
    // If we are already migrating, there's no point in outputting migration info.
    if (ds.connected) {
      migrateTables(ds, null);
    } else {
      ds.once('connected', () => {
        migrateTables(ds, null);
      });
    }
  }
  cb();
};
