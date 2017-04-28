(function(){
    'use strict';
    var sessionManager = require('./sessionManager');
    var eh = require('../core/eventsHandler');

    var clients = {};

    module.exports.addSocketEvents = function (socket, io) {

        socket.on('session.create', function(userId, type){
            var _session = sessionManager.createSession(userId, socket.id, type);
            socket.join(_session._id);
            clients[socket.id] = {user:userId, session:_session._id};
        });

        socket.on('session.join', function(sessionId, userId){
            socket.join(sessionId);

            var err = sessionManager.joinSession(sessionId, userId, socket.id);
            if (err.code != 200) return socket.emit('session.error', null, err);

            clients[socket.id] = {user:userId, session:sessionId};
        });

        socket.on('session.leave', function(sessionId, userId){
            sessionManager.leaveSession(sessionId, userId);
            socket.leave(sessionId);
            delete clients[socket.id];
        });

        socket.on('session.event', function(sessionId, userId, eventName, eventData){
            sessionManager.clientEvent(sessionId, userId, eventName, eventData);
        });

        socket.on('disconnect', function(){

            if (clients[socket.id]) {
                sessionManager.leaveSession(clients[socket.id].session, clients[socket.id].user);
                socket.leave(clients[socket.id].session);
                delete clients[socket.id];
            }
        });

    };


    module.exports.addIOEvents = function (io) {

        //BASE SESSION EVENTS
        //--------------------------------------------------------
        eh.on('session.status.change', function(session, status) {
            console.log('status change: '+ status);
            io.to(session._id).emit('session.status.change', session, status);
        });

        eh.on('session.destroyed', function(session) {
            io.to(session._id).emit('session.destroyed', session);
        });

        eh.on('session.created', function(session) {
            io.to(session.ownerSocket).emit('session.created', session);
        });

        eh.on('session.user.status', function(session, user, status) {
            io.to(session._id).emit('session.user.status', user, status);
        });

        eh.on('session.user.joined', function(session, user) {
            io.to(session._id).emit('session.user.joined', session, user);
        });

        //Send message of join succes directly to user (not broadcast).
        eh.on('session.joined.success', function(session, conn) {
            io.to(conn.socket).emit('session.joined.success', session);
        });

        eh.on('session.error', function(session, error) {
            io.to(session._id).emit('session.error', session, error);
        });

        eh.on('session.user.left', function(session, user) {
            io.to(session._id).emit('session.user.left', session, user);
        });

        //PLAY SESSION EVENTS
        //-----------------------------------------------------------------
        eh.on('session.countdown.tick', function(session, count) {
            io.to(session._id).emit('session.countdown.tick', session, count);
        });

        eh.on('session.game.start', function(session) {
            io.to(session._id).emit('session.game.start', session);
        });

        eh.on('session.unable.start', function(session, reason) {
            io.to(session._id).emit('session.unable.start', session, reason);
        });


        //PLAY PULSE EVENTS
        //--------------------------------------------------------------------
        eh.on('session.pulse.pulse', function(session, user) {
            //Meaning that userId has pulsed the pulser...and is the first also.
            io.to(session._id).emit('session.pulse.pulse', session, user);
        });

        eh.on('session.pulse.question', function(session, user) {
            io.to(session._id).emit('session.pulse.question', session, user);
        });

        eh.on('session.pulse.question.answered', function(session, user) {
            io.to(session._id).emit('session.pulse.question.answered', session, user);
        });

        eh.on('session.pulse.rebound', function(session, user) {
            //Meaning incorrect answer...another user is forced to respond
            io.to(session._id).emit('session.pulse.rebound', session, user);
        });

        //PLAY TRIVIA EVENTS
        //-------------------------------------------------------------------
        eh.on('session.trivia.winner', function(session, user) {
            io.to(session._id).emit('session.trivia.winner', session, user);
        });

        eh.on('session.trivia.finish', function(session) {
            io.to(session._id).emit('session.trivia.finish', session);
        });

        eh.on('session.trivia.question', function(session, question) {
            io.to(session._id).emit('session.trivia.question', session, question);
        });

        eh.on('session.trivia.selected', function(session) {
            io.to(session._id).emit('session.trivia.selected', session);
        });
    };


}).call(this);
