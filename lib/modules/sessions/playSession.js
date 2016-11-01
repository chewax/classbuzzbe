(function(){
    'use strict';

    var Session = require('./session');
    var eh = require('../core/eventsHandler');

    module.exports = PlaySession;

    /**
     * Creates New Play Session. Inherits from Session.
     * @param userId - User that owns the session
     * @param socketId - User socket id. Most messages will be sent to room (which is identified by the session
     * _id, but if a direct message must be sent we better have the socketId.
     * @param type - The type of session being created. Typically will be play.XXX. Meaning, is a play session of subtype XXX
     */
    function PlaySession (userId, socketId, type) {
        Session.call(this, userId, socketId, type);
    }

    //PlaySession inherits from Session.
    PlaySession.prototype = Object.create(Session.prototype);
    PlaySession.prototype.constructor = PlaySession;


    /**
     * Sets user status inside a session
     * @param _id - Session Id
     * @param userId - User Id
     * @param status - New Status
     * @private
     */
    PlaySession.prototype._setUserStatus = function(userId, status) {
        Session.prototype._setUserStatus.call(this, userId, status);
        this._checkAllReady();
    };

    /**
     * Checks if all connected users are ready. If so, broadcast message.
     * @private
     */
    PlaySession.prototype._checkAllReady = function () {
        var allReady = true;
        this.connected.forEach(function(elem, idx, arr){
            allReady = allReady && (elem.status == 'ready');
        });

        if (allReady) eh.emit('session.ready', this);
        else eh.emit('session.not-ready', this);

        return allReady;
    };

    PlaySession.prototype.startGame = function (userId) {

        if (this.owner.toString() != userId.toString()) {
            return eh.emit('session.unable.start', this);
        }

        else if (this._checkAllReady()  && !this.inSession) {
            this.inSession = true;
            return this._countDown(5, 1000);
        }

        else {
            eh.emit('session.not-ready', this);
        }

    };

    /**
     * Starts countdown
     * @param count - count length
     * @param tick - tick in miliseconds
     * @private
     */
    PlaySession.prototype._countDown = function (count, tick) {
        var that = this;

        function _tick() {
            eh.emit('session.countdown.tick', that, count);
            count -= 1;
            count > 0 ? setTimeout(_tick, tick) : eh.emit('session.game.start', that);
        }

        setTimeout(_tick, tick);
    }


    PlaySession.prototype.clientEvent = function(userId, event) {
        Session.prototype.clientEvent.call(this, userId, event);

        if (event == 'status.ready') this._setUserStatus(userId, 'ready');
        if (event == 'status.not-ready') this._setUserStatus(userId, 'not-ready');
        if (event == 'game.start') this.startGame(userId);
    };

}).call(this);

