(function () {
    'use strict';

    require('datejs');
    var util = require('util')
    var socketio = require('socket.io');
    var eh = require('../core/eventsHandler');
    var userController = require('../users/userController');
    var specialEventsController = require('../specialEvents/specialEventsController');
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
                socket.user_id = userId;
                socket.join(customer);
                userController.registerConnectionActivity(userId);
                setTimeout(userController.lookForNewQuests(userId), 5000);
                setTimeout(specialEventsController.lookForStudentNewSpecialEvents(userId), 5000);
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


}).call(this);
