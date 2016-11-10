(function() {
    'use strict';


    module.exports.status = {
        READY: 'ready',
        WAITING: 'waiting', //For everyone to be ready.
        IN_PROGRESS: 'in-progress',
        COUNTDOWN: 'countdown',
        NOT_READY: 'not-ready',
        PAUSED: 'paused',
        DESTROYED: 'destroyed',
        PULSED: 'pulsed'
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
        },

        TRIVIA_NOT_SELECTED: {
            code: 400,
            message: 'Trivia has not been selected'
        }
    };


    module.exports.error = {

        NONE: {
            code: 200,
            message: 'Status OK'
        },

        SESSION_NOT_OWNED: {
            code: 300,
            message: 'User does not own session.'
        },

        DUPLICATE_USER: {
            code: 500,
            message: "Duplicate user"
        },

        DUPLICATE_JOIN: {
            code: 501,
            message: "Cannot join, user already joined to session"
        },

        SESSION_IN_PROGRESS: {
            code: 502,
            message: "Cannot join, session already in progress"
        },

        ALREADY_JOINED: {
            code: 503,
            message: "Cannot join, user is already joined to another session"
        }
    }

}).call(this);
