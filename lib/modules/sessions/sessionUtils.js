(function() {
    'use strict';


    module.exports.status = {
        READY: 'ready',
        WAITING: 'waiting',
        IN_PROGRESS: 'in-progress',
        COUNTDOWN: 'countdown',
        NOT_READY: 'not-ready',
        PAUSED: 'paused'
    };


    module.exports.reason = {

        SESSION_NOT_OWNED: {
            code: 100,
            message: 'User does not own session.'
        },

        SESSION_IN_PROGRESS: {
            code: 200,
            message: 'Session is already in progress.'
        },

        SESSION_NOT_READY: {
            code: 300,
            message: 'Not everyone in session is ready'
        }
    }

}).call(this);
