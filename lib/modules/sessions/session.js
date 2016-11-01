(function(){
    'use strict';

    var _ = require('lodash');
    var moment = require('moment');
    var config = require('../../config');
    var IdPool = require('../core/idPool');
    var _idPool = new IdPool(5000);
    var eh = require('../core/eventsHandler');
    var sUtils = require('./sessionUtils');


    module.exports = Session;

    /**
     * Creates Online Session.
     * @param userId - User that owns the session
     * @param socketId - User socket id. Most messages will be sent to room (which is identified by the session
     * _id, but if a direct message must be sent we better have the socketId.
     * @param type - The type of session being created. Typically will be play.XXX. Meaning, is a play session of subtype XXX
     *
     * @returns {{}} - Returns the session object.
     */
    function Session (userId, socketId, type) {

        if ( _.isNil(type)) type = 'play.pulse';

        this._id = _idPool.reserve();
        this.owner = userId;
        this.type = type;
        this.connected = [{user: userId, socket: socketId, connectedAt: moment(), status: sUtils.status.NOT_READY}];
        this.createdAt = moment();
        this.expiresAt = this.createdAt.clone().add( config.playSessionTTL, 'minutes');
        this.status = sUtils.status.WAITING;
    };

    /**
     * Sets user status inside a session
     * @param userId - User Id
     * @param status - New Status
     * @private
     */
    Session.prototype._setUserStatus = function(userId, status) {

        var uIdx = _.findIndex(this.connected, {user: userId});
        this.connected[uIdx].status = status;

        eh.emit('session.user.status', this, userId, status);
    };


    /**
     * Destroys a Session
     */
    Session.prototype.selfDestroy = function() {
        _idPool.release(this._id);
        eh.emit('session.destroyed', this);
    };

    /**
     * Joins user to Session
     * @param userId - User joining session.
     * @param socketId - User socket id. Most messages will be sent to room (which is identified by the session
     * _id, but if a direct message must be sent we better have the socketId.
     */
    Session.prototype.join = function(userId, socketId) {
        var uIdx = _.findIndex(this.connected, {user: userId});

        if (uIdx == -1) {
            //Not in session then push.
            this.connected.push({ user: userId, socket: socketId, connectedAt: moment(), status: sUtils.status.NOT_READY});
            return true;
        }

        return false;
    };

    Session.prototype.leave = function (userId) {
        var uIdx = _.findIndex(this.connected, {user: userId});
        if (uIdx > -1) this.connected.splice(uIdx,1);
    };

    Session.prototype.clientEvent = function(userId, event) {

    }

}).call(this);

