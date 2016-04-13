'use strict';
import * as logger from 'dbc-node-logger';
import app from '../server';

function migrateTables(ds, appModels) {
  if ('string' === typeof appModels) {
    appModels = [appModels];
  }

  let postgres = ds.connector;
  appModels = appModels || Object.keys(postgres._models);
  appModels.forEach((appModel) => {
    if (!(appModel in postgres._models)) {
      throw new Error(`Could not find model: ${appModel}`);
    }
  });

  // Get down to generating sql!
  appModels.forEach((model) => {
    postgres.getTableStatus(model, (err, actualFields, actualIndexes) => {
      let sql = [];
      let downSql = [];
      if (!err && actualFields.length) {
        // Model already exists, start generating a migration
        // Start by adding the new coloumns
        sql = sql.concat(postgres.getColumnsToAdd(model, actualFields).map((colSql) => {
          return `ALTER TABLE ${postgres.tableEscaped(model)} ${colSql}`;
        }));
        downSql = downSql.concat(getAddedColoumnsToDrop(postgres, model, actualFields));

        // Next modify existing properties
        sql = sql.concat(postgres.getPropertiesToModify(model, actualFields).map((colSql) => {
          return `ALTER TABLE ${postgres.tableEscaped(model)} ${colSql}`;
        }));
        downSql = downSql.concat(getModifiedColoumnsToRevert(postgres, model, actualFields));

        // Then drop unneeded coloumns
        sql = sql.concat(postgres.getColumnsToDrop(model, actualFields).map((colSql) => {
          return `ALTER TABLE ${postgres.tableEscaped(model)} ${colSql}`;
        }));
        downSql = downSql.concat(getColoumnsToRestore(postgres, model, actualFields));

        // Finally add indexes
        let indexSql = indexSqlGenerator(postgres, model, actualIndexes);
        if (indexSql.length > 0) {
          sql.push(indexSql);
        }
      }
      else {
        // Model does not exist, create it!
        let name = postgres.tableEscaped(model);

        // Create schema
        sql.push(`CREATE SCHEMA ${postgres.escapeName(postgres.schema(model))}`);

        // Create table
        sql.push(`CREATE TABLE ${name} (\n  ${postgres.propertiesSQL(model)}\n)`);
        downSql.push(`DROP TABLE ${name}`);

        // Create indexes
        let indexSql = indexSqlGenerator(postgres, model, undefined);
        if (indexSql.length > 0) {
          sql.push(indexSql);
        }
      }

      if (sql.length > 0) {
        console.log('\nUP:');
        sql.forEach((sqlStatements) => {
          sqlStatements.split(', ').forEach((statement) => {
            console.log(`${statement};`);
          });
        });

        console.log('\nDOWN:');
        downSql.forEach((sqlStatements) => {
          sqlStatements.split(', ').forEach((statement) => {
            console.log(`${statement};`);
          });
        });
      }
    });
  });
}

function getAddedColoumnsToDrop(postgres, model, actualFields) {
  let m = postgres._models[model];
  let propNames = Object.keys(m.properties);
  let sql = [];
  propNames.forEach(function(propName) {
    if (postgres.id(model, propName)) return;
    var found = postgres.searchForPropertyInActual(
      model, postgres.column(model, propName), actualFields);
    if (!found && postgres.propertyHasNotBeenDeleted(model, propName)) {
      sql.push(`ALTER TABLE ${postgres.tableEscaped(model)} DROP COLUMN ${postgres.escapeName(propName)}`);
    }
  });

  return sql;
}

function getModifiedColoumnsToRevert(postgres, model, actualFields) {
  let sql = [];
  let m = postgres._models[model];
  let propNames = Object.keys(m.properties);
  let found;
  propNames.forEach((propName) => {
    if (postgres.id(model, propName)) {
      return;
    }
    found = postgres.searchForPropertyInActual(model, propName, actualFields);
    if (found && postgres.propertyHasNotBeenDeleted(model, propName)) {
      if (datatypeChanged(propName, found)) {
        sql.push(`ALTER TABLE ${postgres.tableEscaped(model)} ALTER COLUMN ${postgres.escapeName(propName)} TYPE ${found.type.toUpperCase()}`);
      }

      if (nullabilityChanged(propName, found)) {
        sql.push(
          `ALTER TABLE ${postgres.tableEscaped(model)} ALTER COLUMN ${postgres.escapeName(propName)} `+
          `${found.nullable === 'YES' ? 'DROP NOT NULL' : 'SET NOT NULL'}`
        );
      }
    }
  });

  return sql;

  function datatypeChanged(propName, oldSettings) {
    var newSettings = m.properties[propName];
    if (!newSettings) {
      return false;
    }
    return oldSettings.type.toUpperCase() !== postgres.columnDataType(model, propName);
  }

  function nullabilityChanged(propName, oldSettings) {
    var newSettings = m.properties[propName];
    if (!newSettings) {
      return false;
    }
    var changed = false;
    if (oldSettings.nullable === 'YES' && !postgres.isNullable(newSettings)) {
      changed = true;
    }
    if (oldSettings.nullable === 'NO' && postgres.isNullable(newSettings)) {
      changed = true;
    }
    return changed;
  }
}

function getColoumnsToRestore(postgres, model, actualFields) {
  let sql = [];
  actualFields.forEach((actualField) => {
    if (postgres.idColumn(model) === actualField.column) {
      return;
    }

    if (actualFieldNotPresentInModel(actualField, model)) {
      console.log('bob');
      console.log(actualField);
      // sql.push('DROP COLUMN ' + self.escapeName(actualField.column));
    }
  });

  return sql;

  function actualFieldNotPresentInModel(actualField, model) {
    return !(postgres.propertyName(model, actualField.column));
  }
}

function normalizeIndexKeyDefinition(keys) {
  let column;
  let attribs;
  let parts;
  let result;

  // Default is ASC
  if (typeof keys === 'string') {
    result = keys.split(',').map(function(key) {
      parts = key.trim().split(' ');
      column = parts[0].trim();
      attribs = parts.slice(1).join(' ');
      return column && [column, attribs];
    }).filter(function(key) {
      return key.length;
    });
  }
  else if (typeof keys.length === 'undefined') {
    result = Object.keys(keys).map(function(column) {
      attribs = keys[column] === -1 ? 'DESC' : 'ASC';
      return column && [column, attribs];
    });
  }
  else if (keys && keys.length) {
    result = keys.map(function(column) {
      if (typeof column === 'string') {
        parts = column.trim().split(' ');
        column = parts[0].trim();
        attribs = parts.slice(1).join(' ');
        return column && [column, attribs];
      } else {
        return column;
      }
      return column && [column, 'ASC'];
    });
  } else {
    throw Error('Index keys definition appears to be invalid: ', keys);
  }

  return result;
}

function normalizeIndexDefinition(index) {
  if (typeof index === 'object'  && index.keys) {
    // Full form
    index.options = index.options || {};
    index.keys = normalizeIndexKeyDefinition(index.keys);
    return index;
  }

  return {
    keys: normalizeIndexKeyDefinition(index.keys && index.keys || index),
    options: {}
  };
}

function indexSqlGenerator(postgres, model, actualIndexes) {
  let m = postgres._models[model];
  let propNames = Object.keys(m.properties).filter(function (name) {
    return !!m.properties[name];
  });

  let indexNames = m.settings.indexes && Object.keys(m.settings.indexes).filter(function (name) {
      return !!m.settings.indexes[name];
    }) || [];

  let sql = [];
  let ai = {};
  const propNameRegEx = new RegExp('^' + postgres.table(model) + '_([^_]+)_idx');
  if (actualIndexes) {
    actualIndexes.forEach(function (i) {
      let name = i.name;
      if (!ai[name]) {
        ai[name] = i;
      }
    });
  }
  let aiNames = Object.keys(ai);

  // remove indexes
  aiNames.forEach(function (indexName) {
    let i = ai[indexName];
    let propName = propNameRegEx.exec(indexName);
    let si; // index definition from model schema

    if (i.primary || (m.properties[indexName] && postgres.id(model, indexName))) return;

    propName = propName && postgres.propertyName(model, propName[1]) || null;
    if (!(indexNames.indexOf(indexName) > -1) && !(propName && m.properties[propName] && m.properties[propName].index)) {
      sql.push('DROP INDEX ' + postgres.escapeName(indexName));
    } else {
      // The index was found, verify that database matches what we're expecting.
      // first: check single column indexes.
      if (propName) {
        // If this property has an index definition, verify that it matches
        if (m.properties[propName] && (si = m.properties[propName].index)) {
          if (
            (typeof si === 'object') &&
            !((!si.type || si.type === ai[indexName].type) && (!si.unique || si.unique === ai[indexName].unique))
          ) {
            // Drop the index if the type or unique differs from the actual table
            sql.push('DROP INDEX ' + postgres.escapeName(indexName));
            delete ai[indexName];
          }
        }
      } else {
        // second: check other indexes
        si = normalizeIndexDefinition(m.settings.indexes[indexName]);

        var identical =
          (!si.type || si.type === i.type) && // compare type
          ((si.options && !!si.options.unique) === i.unique); // compare unique

        // if this is a multi-column query, verify that the order matches
        var siKeys = Object.keys(si.keys);
        if (identical && siKeys.length > 1) {
          if (siKeys.length === i.keys.length) {
            siKeys.forEach(function (propName, iter) {
              identical = identical && postgres.column(model, propName) === i.keys[iter];
            });
          }
        }

        if (!identical) {
          sql.push('DROP INDEX ' + postgres.escapeName(indexName));
          delete ai[indexName];
        }
      }
    }
  });

  // add single-column indexes
  propNames.forEach(function(propName) {
    let i = m.properties[propName].index;
    if (!i) {
      return;
    }

    // The index name used should match the default naming scheme
    // by postgres: <column>_<table>_idx
    let iName = [postgres.table(model), postgres.column(model, propName), 'idx'].join('_');

    let found = ai[iName];
    if (!found) {
      let pName = postgres.escapeName(postgres.column(model, propName));
      let type = '';
      let kind = '';
      if (i.type) {
        type = ' USING ' + i.type;
      }
      if (i.kind) {
        kind = i.kind;
      }

      if (!kind && !type && typeof i === 'object' || i.unique && i.unique === true) {
        kind = ' UNIQUE ';
      }

      sql.push('CREATE ' + kind + ' INDEX ' + postgres.escapeName(iName) + ' ON ' + postgres.tableEscaped(model) + type + ' ( ' + pName + ' )');
    }
  });

  // add multi-column indexes
  indexNames.forEach(function(indexName) {
    let i = m.settings.indexes[indexName];
    let found = ai[indexName];
    if (!found) {
      i = normalizeIndexDefinition(i);
      let iName = postgres.escapeName(indexName);
      let columns = i.keys.map(function (key) {
        return postgres.escapeName(postgres.column(model, key[0])) + (key[1] ? ' ' + key[1] : '');
      }).join(', ');

      let type = '';
      let kind = '';
      if (i.type) {
        type = ' USING ' + i.type;
      }
      if (i.kind) {
        kind = i.kind;
      }

      if (i.options && i.options.unique && i.options.unique === true) {
        kind = ' UNIQUE ';
      }

      sql.push('CREATE ' + kind + ' INDEX ' + iName + ' ON ' + postgres.tableEscaped(model) + type + ' ( ' + columns + ')');
    }
  });

  return sql.join(', ');
}

module.exports = function automigrate(model, cb) {

  let ds = app.dataSources.PsqlDs;
  const appModels = [
    'Profile',
    'Like',
    'Group',
    'Comment',
    'Quarantine',
    'Post',
    'PostLike',
    'GroupProfile',
    'CommunityRole',
    'ProfileCommunityRole',
    'Flag',
    'file',
    'resolution',
    'review',
    'imageCollection',
    'videoCollection'
  ];

  if (ds.connected) {
    migrateTables(ds, appModels);
  }
  else {
    ds.once('connected', () => {
      migrateTables(ds, appModels);
    });
  }
  cb();
};

