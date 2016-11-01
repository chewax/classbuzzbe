(function () {
    'use strict';

    require('datejs');
    var util = require('util')
    var socketio = require('socket.io');
    var eh = require('../core/eventsHandler');
    var userController = require('../users/userController');
    var specialEventsController = require('../specialEvents/specialEventsController');
    var sessionManager = require('../sessions/sessionManager');
    var _ = require('lodash');

    var io;

    var clients = {};

    module.exports.initSocketServer = function(server) {
        io = socketio.listen(server);

        io.on('connection', function(socket){

            /**
             * Ties socket to user and joins customer channel
             * All livefeed events are broadcasted to that channel
             */
            socket.on('tieandjoin', function(userId, customer) {
                clients[userId] = socket.id;
                socket.join(customer);
                io.to(socket.id).emit('joined.channel', customer);

                userController.registerConnectionActivity(userId);
                setTimeout(userController.lookForNewQuests(userId), 5000);
                setTimeout(specialEventsController.lookForStudentNewSpecialEvents(userId), 5000);
            });

            socket.on('session.create', function(userId, type){
                if ( _.isNil(type)) type = 'play.pulse';
                var _session = sessionManager.createSession(userId, socket.id, type);
                socket.join(_session._id);
                io.to(socket.id).emit('session.created', _session);
            });

            socket.on('session.join', function(sessionId, userId){
                var _session = sessionManager.joinSession(sessionId, userId, socket.id);
                io.to(socket.id).emit('session.joined', _session);
            });

            socket.on('session.leave', function(sessionId, userId){
                var _session = sessionManager.leaveSession(sessionId, userId);
                socket.leave(sessionId);
                io.to(socket.id).emit('session.left', _session);
            });

            socket.on('session.event', function(sessionId, userId, eventName){
                sessionManager.clientEvent(sessionId, userId, eventName);
            });

        });
    };

    eh.on('newevent', function(event) {
        if (event.showOnFeed) io.to(event.customer).emit('newevent', event);
    });

    eh.on('questcompleted', function(user, quest) {

        if (typeof clients[user._id] != 'undefined')
            io.to(clients[user._id]).socket.emit('questcompleted', quest);
    });

    eh.on('newnotification', function(user, notification){

        if (typeof clients[user._id] != 'undefined')
            io.to(clients[user._id]).emit('newnotification', notification);
    });

    eh.on('incomingspecialevent', function(user, event) {

        if (typeof clients[user._id] != 'undefined')
            io.to(clients[user._id]).emit('incomingspecialevent', event);
    });

    eh.on('activitycompleted', function(user, activity){

        if (typeof clients[user._id] != 'undefined')
            io.to(clients[user._id]).emit('activitycompleted', activity);
    });


    eh.on('newquestavailable', function(user, newQuest) {
        if (typeof clients[user._id] != 'undefined')
            io.to(clients[user._id]).emit('newquestavailable', newQuest);
    });

    eh.on('traitacquired', function(user, trait) {

        if (typeof clients[user._id] != 'undefined')
            io.to(clients[user._id]).emit('traitacquired', trait);
    });

    eh.on('skilllevelup', function(user, skill, newRank) {

        if (typeof clients[user._id] != 'undefined')
            io.to(clients[user._id]).emit('skilllevelup', skill, newRank);
    });

    eh.on('achievementunlocked', function(user, achievement) {

        if (typeof clients[user._id] != 'undefined')
            io.to(clients[user._id]).emit('achievementunlocked', achievement);
    });

    eh.on('goalcompleted', function(user, goal) {

        if (typeof clients[user._id] != 'undefined')
            io.to(clients[user._id]).emit('goalcompleted', goal);
    });


    //SESSION EVENTS
    //----------------------------------

    eh.on('session.ready', function(_session) {
        //There should be a channel for session _id.
        io.to(_session._id).emit('session.ready', _session);
    });

    eh.on('session.not-ready', function(_session) {
        //There should be a channel for session _id.
        io.to(_session._id).emit('session.not-ready', _session);
    });

    eh.on('session.destroyed', function(_session) {
        //There should be a channel for session _id.
        io.to(_session._id).emit('session.destroyed', _session._id);
    });

    eh.on('session.user.status', function(_session, _userId, _newStatus) {
        io.to(_session._id).emit('session.user.status', _userId, _newStatus);
    });

    eh.on('session.countdown.tick', function(_session, count) {
        io.to(_session._id).emit('session.countdown.tick', count);
    });

    eh.on('session.game.start', function(_session, count) {
        io.to(_session._id).emit('session.game.start');
    });

    eh.on('session.unable.start', function(_session) {
        io.to(_session._id).emit('session.unable.start');
    });


}).call(this);
