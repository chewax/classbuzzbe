(function(){
    'use strict';

    var activeSessions = [];

    var _ = require('lodash');
    var moment = require('moment');
    var config = require('../../config');
    var IdPool = require('../core/idPool');
    var _idPool = new IdPool(5000);

    module.exports.createSession = createSession;
    module.exports.destroySession = destroySession;
    module.exports.joinSession = joinSession;
    module.exports.leaveSession = leaveSession;

    /**
     * Creates Online Session.
     * @param userId - User that owns the session
     * @param socketId - User socket id. Most messages will be sent to room (which is identified by the session
     * _id, but if a direct message must be sent we better have the socketId.
     * @param type - The type of session being created. Typically will be play.XXX. Meaning, is a play session of subtype XXX
     *
     * @returns {{}} - Returns the session object.
     */
    function createSession (userId, socketId, type) {

        if (_isNil(type)) type = 'play.pulse';

        var _session = {};
        _session._id = _idPool.reserve();
        _session.owner = userId;
        _session.type = type;
        _session.connected = [{user: userId, socket: socketId, connectedAt: moment(), status:'not-ready'}];
        _session.createdAt = moment();
        _session.expiresAt = _session.createdAt.clone().add( config.playSessionTTL, 'minutes' );

        activeSessions.push(_session);
        return _session
    }

    /**
     * Destroys a Session
     * @param _id - session id
     */
    function destroySession (_id) {
        var sIdx = _.findIndex(activeSessions, {_id: _id});
        if (sIdx > -1) activeSessions.splice(sIdx, 1);
        _idPool.release(_id);
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
        activeSessions[sIdx].connected.push({ user: userId, socket: socketId, connectedAt: moment(), status:'not-ready'});
        return activeSessions[sIdx];
    }


    /**
     * Removes user from session
     * @param _id - Session Id
     * @param userId - User Id
     */
    function leaveSession (_id, userId) {
        var sIdx = _.findIndex(activeSessions, {_id: _id});
        var uIdx = _.findIndex(activeSessions[sIdx].connected, {user: userId});
        return activeSessions[sIdx].connected.splice(uIdx,1)[0];
    }

    /**
     * Sets user status inside a session
     * @param _id - Session Id
     * @param userId - User Id
     * @param status - New Status
     */
    function setUserStatus (_id, userId, status) {
        if ( _.isNil(status)) status = "ready";
        var sIdx = _.findIndex(activeSessions, {_id: _id});
        var uIdx = _.findIndex(activeSessions[sIdx].connected, {user: userId});
        activeSessions[sIdx].connected[uIdx].status = status;
    }

    /**
     * Handles a session client event
     * @param _id - Session Id
     * @param userId - User Id
     * @param event - Event name
     */
    function clientEvent (_id, userId, event) {

    }

}).call(this);

