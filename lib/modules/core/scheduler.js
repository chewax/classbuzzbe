(function () {
    'use strict';

    var schedule = require('node-schedule');
    var userController = require('../users/userController');

    if (process.env.SCHEDULE_NEWSLETTER_PROCESS == "true") {
        console.info("[classbuzz] Mailing process scheduled".green);
        setTimeout(scheduleMailingJob,1000);
    }
    else {
        console.info("[classbuzz] Mailing process NOT scheduled".yellow);
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

}).call(this);
