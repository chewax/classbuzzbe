(function () {

    'use strict';

    var eh = require('../core/eventsHandler');
    var log4js = require('log4js');


    //Should log all API events

    eh.on('newevent', function(event) {
        console.info(('[INFO] - New Event:  ' + event.description).green);
    });

    eh.on('questcompleted', function(user, quest) {
        console.info(('[INFO] - User:  ' + user.fullName).green);
        console.info(('[INFO] - Quest Completed: ' + quest.name).green);
    });

    eh.on('traitacquired', function(user, trait) {
        console.info(('[INFO] - User:  ' + user.fullName).green);
        console.info(('[INFO] - Trait Acquired: ' + trait.name).green);
    });

    eh.on('skilllevelup', function(user, skill, newRank) {
        console.info(('[INFO] - User:  ' + user.fullName).green);
        console.info(('[INFO] - Skill level up: ' + skill.name).green);
        console.info(('[INFO] - New rank: ' + newRank.name).green);
    });

    eh.on('activitycompleted', function(user, activity) {
        console.info(('[INFO] - User:  ' + user.fullName).green);
        console.info(('[INFO] - Activity completed: ' + activity.name).green);
    });

    eh.on('achievementunlocked', function(user, achievement) {
        console.info(('[INFO] - User:  ' + user.fullName).green);
        console.info(('[INFO] - Achievement unlocked: ' + achievement.name).green);
    });

    eh.on('goalcompleted', function(user, goal) {
        console.info(('[INFO] - User:  ' + user.fullName).green);
        console.info(('[INFO] - Goal Completed: ' + goal.name).green);
    });
    
    eh.on('streaklost', function(user) {
        console.info(('[INFO] - User:  ' + user.fullName).green);
        console.info(('[INFO] - Access streak lost').green);
    });

    eh.on('newstreakday', function(user) {
        console.info(('[INFO] - User:  ' + user.fullName).green);
        console.info(('[INFO] - New access streak day').green);
    });

    eh.on('levelup', function(user) {
        console.info(('[INFO] - User:  ' + user.fullName).green);
        console.info(('[INFO] - Level up! New level: ' + user.student.character.levelInfo.level).green);
    });

    eh.on('newquestavailable', function(user, quest) {
        console.info(('[INFO] - User:  ' + user.fullName).green);
        console.info(('[INFO] - New Quest: ' + quest.name).green);
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