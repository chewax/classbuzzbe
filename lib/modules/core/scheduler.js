(function () {
    'use strict';

    var schedule = require('node-schedule');
    var userController = require('../users/userController');
    var gc = require('./garbageCollector');

    scheduleBirthdayJob();
    console.info("[classbuzz] Birthday job scheduled".green);

    scheduleGC();
    console.info("[classbuzz] Garbage Collector job scheduled".green);

    if (process.env.SCHEDULE_NEWSLETTER_PROCESS == "true") {
        console.info("[classbuzz] Mailing job scheduled".green);
        setTimeout(scheduleMailingJob,1000);
    }
    else {
        console.info("[classbuzz] Mailing job NOT scheduled".yellow);
    }


    function scheduleMailingJob(){
        var rule = new schedule.RecurrenceRule();

        //RUN EVERY FRIDAY AT 23:59
        rule.dayOfWeek = 5;
        rule.hour = 23;
        rule.minute = 59;

        var mailingJob = schedule.scheduleJob(rule, function(){
            userController.parentUpdateMailingProcess();
        });
    }


    function scheduleBirthdayJob(){
        var rule = new schedule.RecurrenceRule();

        //RUN EVERY DAY AT 06:00
        rule.hour = 6;
        rule.minute = 0;

        var birthdayJob = schedule.scheduleJob(rule, function(){
            userController.checkForIncomingBirthdays();
        });
    }

    function scheduleGC(){

        //RUN EVERY 20 minutes
        var rule = new schedule.RecurrenceRule();
        rule.minute = new schedule.Range(0, 59, 20);

        var tmpFileJob = schedule.scheduleJob(rule, function(){
            gc.trashTmpFiles();
        });
    }

}).call(this);
