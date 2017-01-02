(function(){
    'use strict';

    var messageController = require('./messageController');
    var eh = require('../core/eventsHandler');
    var _ = require('lodash');

    var clients = {};

    module.exports.addSocketEvents = function (socket, io) {

        socket.on('tieandjoin', function(userId) {


            var status = {
                socket: socket.id,
                status: 'online',
                last: Date.now()
            };

            //La sobreescribo siempre
            clients[userId] = status;
            socket.broadcast.emit('user.status', userId, status);

        });

        socket.on('message.writing', function(fromUser, toUser){
            io.to(clients[toUser].socket).emit('message.writing', fromUser);
        });

        socket.on('message.stopped.writing', function(fromUser, toUser){
            io.to(clients[toUser].socket).emit('message.stopped.writing', fromUser);
        });

        socket.on('message.new', function(fromUser, toUser, msg){
            var data = {
                from: fromUser,
                to: toUser,
                body: msg
            };

            messageController.newMessage(data)
                .then(function(result){
                    io.to(clients[toUser].socket).emit('message.new', result);
                    io.to(socket.id).emit('message.new', result);

                    if (clients[toUser].status != 'online') eh.emit('newprivatemessage', result.to, result);
                })
        });

        socket.on('user.get.status', function(who){

            var status = {};

            if (typeof clients[who] == 'undefined') {
                status.status = 'away';
                status.last = 'never';
            }
            else {
                status.status = clients[who].status;
                status.last = clients[who].last;
            }

            io.to(socket.id).emit('user.status', who, status);
        });


        socket.on('disconnect', function(){
            var who = _.findKey(clients, { socket: socket._id } );

            if (typeof clients[who] != 'undefined') {
                clients[who].status = 'away';
                clients[who].last = Date.now();
            }

        })

    };


    module.exports.addIOEvents = function (io) {

        eh.on('eventname', function(fromUser, toUser, data) {
            io.to(clients[toUser].socket).emit('eventname', fromUser, data);
        });

    };


}).call(this);
