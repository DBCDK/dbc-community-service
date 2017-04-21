export function getAddedColoumnsToDrop(postgres, model, actualFields) {
  let m = postgres._models[model];
  let propNames = Object.keys(m.properties);
  let sql = [];
  propNames.forEach(function(propName) {
    if (postgres.id(model, propName)) {
      return;
    }
    var found = postgres.searchForPropertyInActual(
      model, postgres.column(model, propName), actualFields);
    if (!found && postgres.propertyHasNotBeenDeleted(model, propName)) {
      sql.push(`ALTER TABLE ${postgres.tableEscaped(model)} DROP COLUMN ${postgres.escapeName(propName)}`);
    }
  });

  return sql;
}

export function getModifiedColoumnsToRevert(postgres, model, actualFields) {
  let sql = [];
  let m = postgres._models[model];
  let propNames = Object.keys(m.properties);
  let found;

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
          `ALTER TABLE ${postgres.tableEscaped(model)} ALTER COLUMN ${postgres.escapeName(propName)} ` +
          `${found.nullable === 'YES' ? 'DROP NOT NULL' : 'SET NOT NULL'}`
        );
      }
    }
  });

  return sql;
}

export function getColoumnsToRestore(postgres, model, actualFields) {
  function actualFieldNotPresentInModel(actualField, currentModel) {
    return !(postgres.propertyName(currentModel, actualField.column));
  }

  let sql = [];
  actualFields.forEach((actualField) => {
    if (postgres.idColumn(model) === actualField.column) {
      return;
    }

    if (actualFieldNotPresentInModel(actualField, model)) {
      sql.push(
        `ALTER TABLE ${postgres.tableEscaped(model)} ` +
        `ADD COLUMN ${postgres.escapeName(actualField.column)} ${actualField.type.toUpperCase()}`
      );
    }
  });

  return sql;
}

export function normalizeIndexKeyDefinition(keys) {
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
    result = Object.keys(keys).map(function(resultColumn) {
      attribs = keys[resultColumn] === -1 ? 'DESC' : 'ASC';
      return resultColumn && [resultColumn, attribs];
    });
  }
  else if (keys && keys.length) {
    result = keys.map(function(resultColumn) {
      if (typeof resultColumn === 'string') {
        parts = resultColumn.trim().split(' ');
        resultColumn = parts[0].trim();
        attribs = parts.slice(1).join(' ');
        return resultColumn && [resultColumn, attribs];
      }

      return resultColumn;
    });
  }
  else {
    throw Error('Index keys definition appears to be invalid: ', keys);
  }

  return result;
}

export function normalizeIndexDefinition(index) {
  if (typeof index === 'object' && index.keys) {
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

export function indexSqlGenerator(postgres, model, actualIndexes) {
  let m = postgres._models[model];
  let propNames = Object.keys(m.properties).filter(function(name) {
    return !!m.properties[name];
  });

  let indexNames = m.settings.indexes && Object.keys(m.settings.indexes)
      .filter(function(name) {
        return !!m.settings.indexes[name];
      }) || [];

  let sql = [];
  let ai = {};
  const propNameRegEx = new RegExp('^' + postgres.table(model) + '_([^_]+)_idx');
  if (actualIndexes) {
    actualIndexes.forEach(function(i) {
      let name = i.name;
      if (!ai[name]) {
        ai[name] = i;
      }
    });
  }
  let aiNames = Object.keys(ai);

  // remove indexes
  aiNames.forEach(function(indexName) {
    let i = ai[indexName];
    let propName = propNameRegEx.exec(indexName);
    let si; // index definition from model schema

    if (i.primary || (m.properties[indexName] && postgres.id(model, indexName))) {
      return;
    }

    propName = propName && postgres.propertyName(model, propName[1]) || null;
    if (!(indexNames.indexOf(indexName) > -1) && !(propName && m.properties[propName] && m.properties[propName].index)) {
      sql.push('DROP INDEX ' + postgres.escapeName(indexName));
    }
    else if (propName) {
      // The index was found, verify that database matches what we're expecting.
      // first: check single column indexes.
      // If this property has an index definition, verify that it matches
      if (m.properties[propName] && (si = m.properties[propName].index)) {
        if (
          (typeof si === 'object') && !((!si.type || si.type === ai[indexName].type) && (!si.unique || si.unique === ai[indexName].unique))
        ) {
          // Drop the index if the type or unique differs from the actual table
          sql.push('DROP INDEX ' + postgres.escapeName(indexName));
          delete ai[indexName];
        }

      }
      else {
        // second: check other indexes
        si = normalizeIndexDefinition(m.settings.indexes[indexName]);

        var identical =
              (!si.type || si.type === i.type) && // compare type
              ((si.options && !!si.options.unique) === i.unique); // compare unique

        // if this is a multi-column query, verify that the order matches
        var siKeys = Object.keys(si.keys);
        if (identical && siKeys.length > 1) {
          if (siKeys.length === i.keys.length) {
            siKeys.forEach(function(siPropName, iter) {
              identical = identical && postgres.column(model, siPropName) === i.keys[iter];
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
      let columns = i.keys.map(function(key) {
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

/**
 * Generates array of SQL queries
 * @param aiNames
 * @param ai
 * @param indexNames
 * @param propNameRegEx
 * @param propNameRegExAlt
 * @param postgres
 * @param model
 * @returns {Array}
 */
function generateSQLForDownIndexes(aiNames, ai, indexNames, propNameRegEx, propNameRegExAlt, postgres, model) {
  const sql = [];

  aiNames.forEach((indexName) => {
    const indexDef = normalizeIndexDefinition(ai[indexName]);
    if (
      indexDef.type === 'btree' &&
      indexDef.primary &&
      indexDef.unique &&
      indexDef.keys[0][0] === 'id'
    ) {
      return;
    }

    if (indexName in indexNames || indexNames.join(' ').toLowerCase().indexOf(indexName.toLowerCase()) >= 0) {
      return;
    }

    let propName = propNameRegEx.exec(indexName) || propNameRegExAlt.exec(indexName);
    propName = (propName && postgres.propertyName(model, propName[1]) || '').toLowerCase();
    const iName = [postgres.table(model), postgres.column(model, propName), 'idx'].join('_');

    if (ai[iName]) {
      return;
    }

    const i = ai[indexName];
    const pName = postgres.escapeName(postgres.column(model, propName));
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
  });

  return sql;
}

export function generateDownIndexes(postgres, model, actualIndexes) {
  actualIndexes = actualIndexes || [];
  const m = postgres._models[model];

  const indexNames = m.settings.indexes && Object.keys(m.settings.indexes)
      .filter(function(name) {
        return !!m.settings.indexes[name];
      }) || [];

  const ai = {};
  const propNameRegEx = new RegExp('^' + postgres.table(model) + '_([^_]+)_idx');
  const propNameRegExAlt = new RegExp('^' + postgres.table(model) + '_([^_]+)_key');
  if (actualIndexes) {
    actualIndexes.forEach(function(i) {
      let name = i.name;
      if (!ai[name]) {
        ai[name] = i;
      }
    });

  }

  const aiNames = Object.keys(ai);

  const sql = generateSQLForDownIndexes(aiNames, ai, indexNames, propNameRegEx, propNameRegExAlt, postgres, model);

  return sql.join(', ');
}
