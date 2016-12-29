(function () {
    'use strict';

    require('datejs');

    var socketio = require('socket.io');
    var sessionSC = require('../sessions/sessionSocketController');
    var coreSC = require('../core/coreSocketController');
    var messageSC = require('../messages/messageSocketController');

    var io;

    module.exports.initSocketServer = function(server) {
        io = socketio.listen(server);

        io.on('connection', function(socket){

            coreSC.addSocketEvents(socket, io);
            sessionSC.addSocketEvents(socket, io);
            messageSC.addSocketEvents(socket, io);

        });

        sessionSC.addIOEvents(io);
        coreSC.addIOEvents(io);
        messageSC.addIOEvents(io);
    };


}).call(this);
