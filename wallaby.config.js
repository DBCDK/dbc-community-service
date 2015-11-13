'use strict';
var babel = require('babel-core');

module.exports = function(wallaby) {
  return {
    files: [
      'common/models/**/*.js',
      '!common/models/**/*.test.js'
    ],

    tests: [
      'common/**/*.test.js'
    ],

    compilers: {
      '**/*.js': wallaby.compilers.babel({
        babel: babel,
        plugins: ['transform-es2015-modules-commonjs']
        // babel options
        // like `stage: n` for Babel 5.x or `presets: [...]` for Babel 6
      })
    },


    env: {
      type: 'node',
      runner: 'node'
    },

    testFramework: 'mocha@2.1.0'
  };
};
