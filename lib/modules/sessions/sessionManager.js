(function(){
    'use strict';

    var _ = require('lodash');
    var Session = require('./session');
    var PlaySession = require('./playSession');
    var PlaySessionPulse = require('./playSessionPulse');
    var PlaySessionTrivia = require('./playSessionTrivia');
    var activeSessions = [];
    var usersInSessions = [];
    var sUtils = require('./sessionUtils');

    module.exports.createSession = createSession;
    module.exports.joinSession = joinSession;
    module.exports.leaveSession = leaveSession;
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

        if (_.isNil(type)) type = 'play.pulse';
        var _session;
        switch (type) {

            case "play":
                _session = new PlaySession(userId, socketId, type);
                break;

            case "play.pulse":
                _session = new PlaySessionPulse(userId, socketId, type);
                break;

            case "play.trivia":
                _session = new PlaySessionTrivia(userId, socketId, type);
                break;

            default:
                _session = new Session(userId, socketId, type);
        }

        usersInSessions.push(userId);
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
        var uIdx = _.findIndex(usersInSessions, function(u){
            return u.toString() == userId.toString();
        });

        if (uIdx != -1) {
            //user already in a session...dont allow to join new one
            return sUtils.error.ALREADY_JOINED;
        }

        var sIdx = _.findIndex(activeSessions, {_id: _id});
        activeSessions[sIdx].join(userId, socketId);

        usersInSessions.push(userId);

        return sUtils.error.NONE;
    }

    /**
     * Removes user from session
     * @param _id - Session Id
     * @param userId - User Id
     */
    function leaveSession (_id, userId) {

        //Remove from active users
        _.pull(usersInSessions, userId);


        var destroyed = false;
        var sIdx = _.findIndex(activeSessions, {_id: _id});

        if (sIdx == -1) {
            return;
        } //No active session to leave from...probably owner left before this user and thus it has been destroyed...

        activeSessions[sIdx].leave(userId);
        var _tmpSession = activeSessions[sIdx];

        //If the one trying to leave is owner, then destroy session.
        if (activeSessions[sIdx].owner.toString() == userId.toString()) {
            activeSessions[sIdx].selfDestroy();
            activeSessions.splice(sIdx, 1);
            destroyed = true;
        }

        // If session is empty, destroy it.
        if (!destroyed) {
            if (activeSessions[sIdx].connected.length <= 0) {
                activeSessions[sIdx].selfDestroy();
                activeSessions.splice(sIdx, 1);
            }
        }

        //Return session that the user just left...even if it was destroyed.
        return _tmpSession;
    }

    /**
     * Handles a session client event
     * @param _id - Session Id
     * @param userId - User Id
     * @param event - Event name
     */
    function clientEvent (_id, userId, event, eventData) {

        var sIdx = _.findIndex(activeSessions, {_id: _id});
        activeSessions[sIdx].clientEvent(userId, event, eventData);
    }


}).call(this);
