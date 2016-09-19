(function () {
    'use strict';

    require('datejs');
    var socketio = require('socket.io');
    var eh = require('../core/eventsHandler');
    var userController = require('../users/userController');
    var io;

    module.exports.initSocketServer = function(server) {
        io = socketio.listen(server);

        io.on('connection', function(socket){

            /**
             * Ties socket to user and joins customer channel
             * All livefeed events are broadcasted to that channel
             */
            socket.on('tieandjoin', function(userId, customer) {
                socket.user_id = userId;
                socket.join(customer);
                userController.registerConnectionActivity(userId);
                setTimeout(userController.lookForNewQuests(userId), 5000);

            });

        });
    };

    eh.on('newevent', function(event) {
        if (event.showOnFeed) io.to(event.customer).emit('newevent', event);
    });

    eh.on('questcompleted', function(user, quest) {
        var socket = io.sockets.sockets.filter( function(s) {return s.user_id == user._id;})[0];
        if (socket !== undefined) {
            socket.emit('questcompleted', quest);
        }
    });

    eh.on('newnotification', function(user, notification){
        var socket = io.sockets.sockets.filter( function(s) {return s.user_id == user._id;})[0];
        if (socket !== undefined) {
            socket.emit('newnotification', notification);
        }
    });

    eh.on('activitycompleted', function(user, activity){
        var socket = io.sockets.sockets.filter( function(s) {return s.user_id == user._id;})[0];
        if (socket !== undefined) {
            socket.emit('activitycompleted', activity);
        }
    });

    eh.on('newquestavailable', function(user, newQuest) {
        var socket = io.sockets.sockets.filter( function(s) {return s.user_id == user._id;} )[0];
        if (socket !== undefined) {
            socket.emit('newquestavailable', newQuest);
        }
    });

    eh.on('traitacquired', function(user, trait) {
        var socket = io.sockets.sockets.filter( function(s) {return s.user_id == user._id;})[0];
        if (socket !== undefined) {
            socket.emit('traitacquired', trait);
        }
    });

    eh.on('skilllevelup', function(user, skill, newRank) {
        var socket = io.sockets.sockets.filter( function(s) {return s.user_id == user._id;})[0];
        if (socket !== undefined) {
            socket.emit('skilllevelup', skill, newRank);
        }
    });

    eh.on('achievementunlocked', function(user, achievement) {
        var socket = io.sockets.sockets.filter( function(s) {return s.user_id == user._id;})[0];
        if (socket !== undefined) {
            socket.emit('achievementunlocked', achievement);
        }
    });

    eh.on('goalcompleted', function(user, goal) {
        var socket = io.sockets.sockets.filter( function(s) {return s.user_id == user._id;})[0];
        if (socket !== undefined) {
            socket.emit('goalcompleted', goal);
        }
    });


}).call(this);
