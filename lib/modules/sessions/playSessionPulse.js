(function(){
    'use strict';

    var PlaySession = require('./playSession');

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

    //PlaySession inherits from Session.
    PlaySessionPulse.prototype = Object.create(PlaySession.prototype);
    PlaySessionPulse.prototype.constructor = PlaySessionPulse;

}).call(this);

