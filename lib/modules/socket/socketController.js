(function () {
    'use strict';

    require('datejs');
    var socketio = require('socket.io');
    var eh = require('../core/eventsHandler');
    var userModel = require ('../users/userModel');
    var userController = require('../users/userController');
    var questModel = require ('../quests/questModel');
    var config = require('../../config');
    var _ = require('underscore');
    var logger = require('../log/logger').getLogger();
    var io;

    module.exports.initSocketServer = function(server) {
        io = socketio.listen(server);

        io.on('connection', function(socket){
            socket.on('tietouser', function(userId){
                socket.user_id = userId;
                userController.registerConnectionActivity(userId);
                userController.lookForNewQuests(userId);
            });

            socket.on('joincustomer', function(customer){
                socket.join(customer);
            });


            socket.on('tieandjoin', function(userId, customer) {
                socket.user_id = userId;
                socket.join(customer);
                userController.registerConnectionActivity(userId);
                setTimeout(userController.lookForNewQuests(userId), 5000);
            });

            socket.on('disconnect', function(){
                //User disconnected...do something?
            });

            socket.on('chatmessage', function(msg){
                //io.emit('newchatmessage', msg);
            });
        });
    };

    eh.on('newevent', function(event) {
        io.to(event.customer).emit('newEvent', event);
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

    eh.on('activityaward', function(user, activity){
        var socket = io.sockets.sockets.filter( function(s) {return s.user_id == user._id;})[0];
        if (socket !== undefined) {
            socket.emit('activityaward', activity);
        }
    });

    eh.on('newquestavailable', function(user, newQuest) {
        var socket = io.sockets.sockets.filter( function(s) {return s.user_id == user._id;})[0];
        if (socket !== undefined) {
            socket.emit('newquestavailable', newQuest);
        }
    });


}).call(this);
