(function(){
    'use strict';

    var messageController = require('./messageController');
    var userModel = require('../users/userModel');
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

            clients[userId] = status;
            socket.broadcast.emit('user.status', userId, status);

        });

        socket.on('message.writing', function(fromUser, toUser){
            if (clients[toUser])
                io.to(clients[toUser].socket).emit('message.writing', fromUser);
        });

        socket.on('message.stopped.writing', function(fromUser, toUser){
            if (clients[toUser])
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

                    io.to(socket.id).emit('message.new', result);

                    userModel.findOne({_id:toUser})
                    .then(function(_student){
                        var _p = _student.student.parents.map(function(p){return p.doc});
                        return userModel.find({doc : {$in: _p}});
                    })
                    .then(function(_parents){
                        
                        _parents.forEach(function(p){
                            console.log(p);
                            console.log(clients[p._id]);

                            if (clients[p._id]){
                                io.to(clients[p._id].socket).emit('message.new', result);
                                if (clients[p._id].status != 'online') eh.emit('newprivatemessage', p, result);
                            }

                            else {
                                eh.emit('newprivatemessage',p , result);
                            }
                            
                                
                            })
                        })
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
            var who = _.findKey(clients, { socket: socket.id } );

            if (typeof clients[who] != 'undefined') {
                clients[who].status = 'away';
                clients[who].last = Date.now();
            }

            socket.broadcast.emit('user.status', who, clients[who]);
        })

    };

    module.exports.addIOEvents = function (io) {

        eh.on('eventname', function(fromUser, toUser, data) {
            io.to(clients[toUser].socket).emit('eventname', fromUser, data);
        });

    };


}).call(this);
