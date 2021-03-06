(function(){
    'use strict';

    var _ = require('lodash');
    var moment = require('moment');
    var config = require('../../config');
    var IdPool = require('../core/idPool');
    var _idPool = new IdPool(1000);
    var eh = require('../core/eventsHandler');
    var sUtils = require('./sessionUtils');
    var User = require('../users/userModel');
    var EventEmitter = require('events').EventEmitter;
    var util = require('util');

    module.exports = Session;

    /**
     * Creates Online Session.
     * @param {string} userId - User that owns the session
     * @param {string} socketId - User socket id. Most messages will be sent to room (which is identified by the session
     * _id, but if a direct message must be sent we better have the socketId.
     * @param {string} type - The type of session being created. Typically will be play.XXX. Meaning, is a play session of subtype XXX
     *
     * @emits session.created
     * @returns {{}} - Returns the session object.
     */
    function Session (userId, socketId, type) {

        EventEmitter.call(this);

        if ( _.isNil(type)) type = 'play.pulse';

        this._id = _idPool.next();
        this.owner = userId;
        this.ownerSocket = socketId;
        this.type = type;
        this.connected = [];
        this.createdAt = moment();
        this.destroyedAt = null;
        this.expiresAt = this.createdAt.clone().add( config.playSessionTTL, 'minutes');
        this.status = sUtils.status.WAITING;

        var self = this;

        this.join(userId, socketId)
            .then(function(result){
                eh.emit('session.created', self);
            });
    };


    util.inherits(Session, EventEmitter);

    /**
     * Sets user status inside a session
     * @param {string} userId - User Id
     * @param {string} status - New Status
     *
     * @emits session.user.status
     * @private
     */
    Session.prototype._setUserStatus = function(userId, status) {

        var uIdx = _.findIndex(this.connected, function(c) { return c.user._id.toString() == userId.toString() });
        this.connected[uIdx].status = status;

        eh.emit('session.user.status', this, this.connected[uIdx].user, status);
    };


    /**
     * Destroys a Session
     * @emits session.destroyed
     * @param {object} Session Object
     */
    Session.prototype.selfDestroy = function() {
        this.status = sUtils.status.DESTROYED;
        this.destroyedAt = moment();
        eh.emit('session.destroyed', this);
    };

    /**
     * Joins user to Session
     * @param {string} userId - User joining session.
     * @param {string} socketId - User socket id. Most messages will be sent to room (which is identified by the session
     * _id, but if a direct message must be sent we better have the socketId.
     *
     * @emits session.user.joined
     * @emits session.error
     */
    Session.prototype.join = function(userId, socketId) {

        if (this.status == sUtils.status.IN_PROGRESS) {
            eh.emit('session.error', this, sUtils.error.SESSION_IN_PROGRESS);
            return Promise.reject(sUtils.error.SESSION_IN_PROGRESS);
        }

        var uIdx = _.findIndex(this.connected, function(c) { return c.user._id.toString() == userId.toString() });

        if (uIdx == -1) {
            var that = this;
            //Not in session then push.
            return User.findMinified(userId)
                .then(function(user){
                    user.score = 0;
                    var conn = { user: user, socket: socketId, connectedAt: moment(), status: sUtils.status.NOT_READY };
                    that.connected.push(conn);
                    that.status = sUtils.status.WAITING;
                    eh.emit('session.user.joined', that, user);
                    eh.emit('session.joined.success', that, conn);
                    return user;
                });
        }
        else {
            eh.emit('session.error', this, sUtils.error.DUPLICATE_JOIN);
            return Promise.reject(sUtils.error.DUPLICATE_JOIN);
        }
    };

    /**
     * Removes user from session.
     * @param {string} userId
     *
     * @emits session.user.left
     */
    Session.prototype.leave = function (userId) {
        var uIdx = _.findIndex(this.connected, function(c) { return c.user._id.toString() == userId.toString() });

        if (uIdx > -1) {
            var userToLeave = this.connected[uIdx].user;
            this.connected.splice(uIdx,1);
            eh.emit('session.user.left', this, userToLeave);
        }

    };

    Session.prototype.clientEvent = function(userId, event, eventData) {

    }

}).call(this);

