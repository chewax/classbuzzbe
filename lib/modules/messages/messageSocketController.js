(function(){
    'use strict';

    var messageController = require('./messageController');
    var eh = require('../core/eventsHandler');

    var clients = {};

    module.exports.addSocketEvents = function (socket, io) {

        socket.on('tieandjoin', function(userId, customer) {
            clients[userId] = socket.id;
        });

        socket.on('message.writing', function(fromUser, toUser){
            io.to(clients[toUser]).emit('message.writing', fromUser);
        });

        socket.on('message.stopped.writing', function(fromUser, toUser){
            io.to(clients[toUser]).emit('message.stopped.writing', fromUser);
        });

        socket.on('message.new', function(fromUser, toUser, msg){

            var data = {
                from: fromUser,
                to: toUser,
                body: msg
            };

            messageController.newMessage(data)
                .then(function(result){
                    io.to(clients[toUser]).emit('message.new', result);
                    io.to(socket.id).emit('message.new', result);
                })
        });

    };


    module.exports.addIOEvents = function (io) {

        eh.on('eventname', function(fromUser, toUser, data) {
            io.to(clients[toUser]).emit('eventname', fromUser, data);
        });

    };


}).call(this);
