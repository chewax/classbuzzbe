(function () {

    'use strict';

    var log4js = require('log4js');

    log4js.configure({

      appenders: [
          {
              type: 'logLevelFilter',
              level: 'INFO',
              maxLevel: 'INFO',
              appender: { type: 'file', filename: '/logs/classbuzz.info.log'}
          },
          {
              type: 'logLevelFilter',
              level: 'WARN',
              maxLevel: 'FATAL',
              appender: { type: 'file', filename: '/logs/classbuzz.error.log'}
          }
      ]

    });

    module.exports = log4js;

}).call(this);