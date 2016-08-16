(function () {

    'use strict';

    var eh = require('../core/eventsHandler');
    var log4js = require('log4js');


    //Should log all API events

    eh.on('newevent', function(event) {
        console.info('[INFO] - New Event:  ' + event.description);
    });

    eh.on('questcompleted', function(user, quest) {
        console.info('[INFO] - User:  ' + user.fullName);
        console.info('[INFO] - Quest Completed: ' + quest.name);
    });

    eh.on('traitacquired', function(user, trait) {
        console.info('[INFO] - User:  ' + user.fullName);
        console.info('[INFO] - Trait Acquired: ' + trait.name);
    });

    eh.on('skilllevelup', function(user, skill, newRank) {
        console.info('[INFO] - User:  ' + user.fullName);
        console.info('[INFO] - Skill level up: ' + skill.name);
        console.info('[INFO] - New rank: ' + newRank.name);
    });

    eh.on('activitycompleted', function(user, activity) {
        console.info('[INFO] - User:  ' + user.fullName);
        console.info('[INFO] - Activity completed: ' + activity.name);
    });

    eh.on('achievementunlocked', function(user, achievement) {
        console.info('[INFO] - User:  ' + user.fullName);
        console.info('[INFO] - Achievement unlocked: ' + achievement.name);
    });

    eh.on('goalcompleted', function(user, goal) {
        console.info('[INFO] - User:  ' + user.fullName);
        console.info('[INFO] - Goal Completed: ' + goal.name);
    });
    
    eh.on('streaklost', function(user) {
        console.info('[INFO] - User:  ' + user.fullName);
        console.info('[INFO] - Access streak lost');
    });

    eh.on('newstreakday', function(user) {
        console.info('[INFO] - User:  ' + user.fullName);
        console.info('[INFO] - New access streak day');
    });

    eh.on('levelup', function(user) {
        console.info('[INFO] - User:  ' + user.fullName);
        console.info('[INFO] - Level up! New level: ' + user.student.character.levelInfo.level);
    });

    eh.on('newquestavailable', function(user, quest) {
        console.info('[INFO] - User:  ' + user.fullName);
        console.info('[INFO] - New Quest: ' + quest.name);
    });


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