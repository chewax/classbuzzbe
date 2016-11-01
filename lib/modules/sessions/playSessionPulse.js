(function(){
    'use strict';

    var PlaySession = require('./playSession');
    var sUtils = require('./sessionUtils');
    var eh = require('../core/eventsHandler');
    var _ = require('lodash');

    module.exports = PlaySessionPulse;

    /**
     * Creates New Play Session. Inherits from Session.
     * @param userId - User that owns the session
     * @param socketId - User socket id. Most messages will be sent to room (which is identified by the session
     * _id, but if a direct message must be sent we better have the socketId.
     * @param type - The type of session being created. Typically will be play.XXX. Meaning, is a play session of subtype XXX
     */
    function PlaySessionPulse (userId, socketId, type) {
        PlaySession.call(this, userId, socketId, type);
    }

    //PlaySessionPulse inherits from PlaySession.
    PlaySessionPulse.prototype = Object.create(PlaySession.prototype);
    PlaySessionPulse.prototype.constructor = PlaySessionPulse;


    PlaySessionPulse.prototype.pulse = function(userId) {
        if (this.status != sUtils.status.IN_PROGRESS) return; //Cannot pulse a game that is not in progress.
        this.status = sUtils.status.WAITING;

        var uIdx = _.findIndex(this.connected, function(c) { return c.user._id.toString() == userId.toString()});
        eh.emit('session.game.pulse', this, this.connected[uIdx].user);
    };

    PlaySessionPulse.prototype.clientEvent = function(userId, event) {
        PlaySession.prototype.clientEvent.call(this, userId, event);
        if (event == 'game.pulse') return this.pulse(userId);
    };

}).call(this);

