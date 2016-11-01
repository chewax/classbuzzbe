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

    //TODO Modularize this.

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
                var _session = sessionManager.createSession(userId, socket.id, type);
                socket.join(_session._id);
            });

            socket.on('session.join', function(sessionId, userId){
                socket.join(sessionId);
                sessionManager.joinSession(sessionId, userId, socket.id);
            });

            socket.on('session.leave', function(sessionId, userId){
                sessionManager.leaveSession(sessionId, userId);
                socket.leave(sessionId);
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

    eh.on('session.status.change', function(session, status) {
        io.to(session._id).emit('session.status.change', session, status);
    });

    eh.on('session.destroyed', function(session) {
        io.to(session._id).emit('session.destroyed', session);
    });

    eh.on('session.created', function(session) {
        io.to(session.ownerSocket).emit('session.created', session);
    });

    eh.on('session.error', function(session, error) {
        io.to(session._id).emit('session.error', session, error);
    });

    eh.on('session.user.status', function(session, user, status) {
        io.to(session._id).emit('session.user.status', user, status);
    });

    eh.on('session.user.joined', function(session, user) {
        io.to(session._id).emit('session.user.joined', session, user);
    });

    eh.on('session.user.left', function(session, user) {
        io.to(session._id).emit('session.user.left', session, user);
    });

    eh.on('session.countdown.tick', function(session, count) {
        io.to(session._id).emit('session.countdown.tick', session, count);
    });

    eh.on('session.game.start', function(session) {
        io.to(session._id).emit('session.game.start', session);
    });

    eh.on('session.unable.start', function(session, reason) {
        io.to(session._id).emit('session.unable.start', session, reason);
    });

    eh.on('session.game.pulse', function(session, user) {
        //Meaning that userId has pulsed the pulser...and is the first also.
        io.to(session._id).emit('session.game.pulse', session, user);
    });


}).call(this);
