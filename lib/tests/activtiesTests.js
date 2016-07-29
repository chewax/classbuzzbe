"use strict";
var vows = require('vows');
var assert = require('assert');
var sandbox = require('sandboxed-module');
var fakes = require('./commonFakes');

function setupController() {

    var activityModelFake = function(){
        return {
            save: function(){}
        }
    }

    var activitiesController = sandbox.require('../lib/modules/activites/activityController', {
        requires: {
            'config': fakes.fakeConfig,
            '../layouts': fakeLayouts
        },
        globals: {
            console: fakeConsole
        }
    });

    return {
        console: fakeConsole
    };
}


vows.describe('classbuzz activityController').addBatch({
    'activityCreation': {
        topic: function() {
            setupController()
        },

        'customer must match logged users': function(result){

        }

    },

    //'mailgun setup': {
    //    topic: setupLogging('mailgun setup', {
    //        apikey: 'APIKEY',
    //        domain: 'DOMAIN',
    //        from: 'sender@domain.com',
    //        to: 'recepient@domain.com',
    //        subject: 'This is subject'
    //    }),
    //    'mailgun credentials should match': function(result){
    //        assert.equal(result.credentials.apiKey, 'APIKEY');
    //        assert.equal(result.credentials.domain, 'DOMAIN');
    //    }
    //},
    //
    //'basic usage': {
    //    topic: function(){
    //        var setup = setupLogging('basic usage', {
    //            apikey: 'APIKEY',
    //            domain: 'DOMAIN',
    //            from: 'sender@domain.com',
    //            to: 'recepient@domain.com',
    //            subject: 'This is subject'
    //        });
    //
    //        setup.logger.info("Log event #1");
    //        return setup;
    //    },
    //    'there should be one message only': function (result) {
    //        assert.equal(result.mails.length, 1);
    //    },
    //    'message should contain proper data': function (result) {
    //        checkMessages(result);
    //    }
    //},
    //'config with layout': {
    //    topic: function () {
    //        var setup = setupLogging('config with layout', {
    //            layout: {
    //                type: "tester"
    //            }
    //        });
    //        return setup;
    //    },
    //    'should configure layout': function (result) {
    //        assert.equal(result.layouts.type, 'tester');
    //    }
    //},
    //'error when sending email': {
    //    topic: function () {
    //        var setup = setupLogging('separate email for each event', {
    //            apikey: 'APIKEY',
    //            domain: 'DOMAIN',
    //            from: 'sender@domain.com',
    //            to: 'recepient@domain.com',
    //            subject: 'This is subject'
    //        });
    //
    //        setup.mailer.messages = function () {
    //            return {
    //                send: function (msg, cb) {
    //                    cb({msg: "log4js.mailgunAppender - Error happened"}, null);
    //                }
    //            };
    //        }
    //
    //        setup.logger.info("This will break");
    //        return setup.console;
    //    },
    //    'should be logged to console': function (cons) {
    //        assert.equal(cons.errors.length, 1);
    //        assert.equal(cons.errors[0].msg, 'log4js.mailgunAppender - Error happened');
    //    }
    //},
    //'separate email for each event': {
    //    topic: function () {
    //        var self = this;
    //        var setup = setupLogging('separate email for each event', {
    //            apikey: 'APIKEY',
    //            domain: 'DOMAIN',
    //            from: 'sender@domain.com',
    //            to: 'recepient@domain.com',
    //            subject: 'This is subject'
    //        });
    //        setTimeout(function () {
    //            setup.logger.info('Log event #1');
    //        }, 0);
    //        setTimeout(function () {
    //            setup.logger.info('Log event #2');
    //        }, 500);
    //        setTimeout(function () {
    //            setup.logger.info('Log event #3');
    //        }, 1100);
    //        setTimeout(function () {
    //            self.callback(null, setup);
    //        }, 3000);
    //    },
    //    'there should be three messages': function (result) {
    //        assert.equal(result.mails.length, 3);
    //    },
    //    'messages should contain proper data': function (result) {
    //        checkMessages(result);
    //    }
    //}

}).export(module);

