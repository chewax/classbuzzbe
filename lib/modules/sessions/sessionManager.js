(function(){
    'use strict';

    var _ = require('lodash');
    var Session = require('./session');
    var PlaySession = require('./playSession');
    var activeSessions = [];

    module.exports.createSession = createSession;
    module.exports.joinSession = joinSession;
    module.exports.leaveSession = leaveSession;
    module.exports.setUserStatus = setUserStatus;
    module.exports.clientEvent = clientEvent;

    /**
     * * Creates Online Session.
     * @param userId - User that owns the session
     * @param socketId - User socket id. Most messages will be sent to room (which is identified by the session
     * _id, but if a direct message must be sent we better have the socketId.
     * @param type - The type of session being created. Typically will be play.XXX. Meaning, is a play session of subtype XXX
     * @returns {Session|exports|module.exports} - The session object
     */
    function createSession (userId, socketId, type) {

        var _session;

        switch (type) {

            case "play":
                _session = new PlaySession(userId, socketId, type);
                break;

            case "play.pulse":
                _session = new PlaySession(userId, socketId, type);
                break;

            default:
                _session = new Session(userId, socketId, type);
        }

        activeSessions.push(_session);
        return _session;
    }



    /**
     * Joins user to Session
     * @param _id - Session Id
     * @param userId - User joining session.
     * @param socketId - User socket id. Most messages will be sent to room (which is identified by the session
     * _id, but if a direct message must be sent we better have the socketId.
     */
    function joinSession (_id, userId, socketId) {
        var sIdx = _.findIndex(activeSessions, {_id: _id});

        if (activeSessions[sIdx].join(userId, socketId))
            return activeSessions[sIdx];
        else
            return {};
    }


    /**
     * Removes user from session
     * @param _id - Session Id
     * @param userId - User Id
     */
    function leaveSession (_id, userId) {

        var sIdx = _.findIndex(activeSessions, {_id: _id});
        activeSessions[sIdx].leave(userId);

        var _tmpSession = activeSessions[sIdx];

        // If session is empty, destroy it.
        if (activeSessions[sIdx].connected.length <= 0) {
            activeSessions[sIdx].selfDestroy();
            activeSessions.splice(sIdx, 1);
        }

        //Return session that the user just left...even if it was destroyed.
        return _tmpSession;
    }

    /**
     * Sets user status inside a session
     * @param _id - Session Id
     * @param userId - User Id
     * @param status - New Status
     */
    function setUserStatus (_id, userId, status) {
        var sIdx = _.findIndex(activeSessions, {_id: _id});
        activeSessions[sIdx].setUserStatus(userId, status);
    }

    /**
     * Handles a session client event
     * @param _id - Session Id
     * @param userId - User Id
     * @param event - Event name
     */
    function clientEvent (_id, userId, event) {
        var sIdx = _.findIndex(activeSessions, {_id: _id});
        activeSessions[sIdx].clientEvent(userId, event);
    }

}).call(this);
