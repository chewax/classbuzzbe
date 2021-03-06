(function () {
    'use strict';

    var schedule = require('node-schedule');
    var userController = require('../users/userController');
    var gc = require('./garbageCollector');
    var debug = require('./debug');
    var utils = require('./utils');
    var moment = require('moment');
    
    scheduleBirthdayJob();

    debug.info('Birthday job scheduled', 'green', false);

    if (process.env.API_MODE != "live") debug.info('Server mode NOT LIVE - this may lead to validation errors because user is not injected into request', 'red', false);

    if (process.env.GC_JOB == "true") {
        debug.info('Garbage Collector job scheduled', 'green', false);
        setTimeout(scheduleGC,1000);
    }
    else {
        debug.info('Garbage Collector job NOT scheduled', 'yellow', false);
    }


    if (process.env.SCHEDULE_NEWSLETTER_PROCESS == "true") {
        debug.info('Mailing job scheduled', 'green', false);
        setTimeout(scheduleMailingJob,1000);
    }
    else {
        debug.info('Mailing job NOT scheduled', 'yellow', false);
    }


    function scheduleMailingJob(){
        var rule = new schedule.RecurrenceRule();

        //RUN EVERY FRIDAY AT 23:59
        rule.dayOfWeek = 5;
        rule.hour = 21;
        rule.minute = 59;
        
        var mailingJob = schedule.scheduleJob(rule, function(){
            
            var fromDate = moment().startOf('week').format();
            var toDate = moment().endOf('week').format();

            var args = [fromDate, toDate];

            utils.runScript(__dirname+'/batch/statusMail_adHoc_batch.js', args , function (err) {
                if (err) throw err;
                console.log('finished running status mail process');
            });
        });

        //====
        // var mailingJob = schedule.scheduleJob(rule, function(){
        //     utils.runScript(__dirname+'/batch/statusMail_batch.js', function (err) {
        //         if (err) throw err;
        //         console.log('finished running status mail process');
        //     });
        // });
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
