(function () {
    'use strict';

    require('datejs');

    var socketio = require('socket.io');
    var sessionSC = require('../sessions/sessionSocketController');
    var coreSC = require('../core/coreSocketController');
    var debug = require('../core/debug');
    var messageSC = require('../messages/messageSocketController');

    var io;

    module.exports.initSocketServer = function(server) {
        io = socketio.listen(server);
        debug.info("Initializing socket.io");

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
