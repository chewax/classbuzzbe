(function(){
    'use strict';

    var Session = require('./session');
    var eh = require('../core/eventsHandler');
    var sUtils = require('./sessionUtils');

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
     * Sets session status
     * @param userId
     * @param status
     * @private
     */
    PlaySession.prototype._setSessionStatus = function(status) {
        this.status = status;
    };


    /**
     * Puts session in pause mode
     */
    PlaySession.prototype.pause = function() {
        this.status = sUtils.status.PAUSED;
        eh.emit('session.game.paused', this);
    };

    /**
     * Resumes session activity
     */
    PlaySession.prototype.resume = function() {
        this.status = sUtils.status.IN_PROGRESS;
        eh.emit('session.game.resumed', this);
    };

    /**
     * Checks if all connected users are ready. If so, broadcast message.
     * @private
     */
    PlaySession.prototype._checkAllReady = function () {
        var allReady = true;

        this.connected.forEach(function(elem, idx, arr){
            allReady = allReady && (elem.status == sUtils.status.READY);
        });

        var praviousStatus = this.status;

        if (allReady) this.status = sUtils.status.READY;
        if (!allReady) this.status = sUtils.status.WAITING;

        if (praviousStatus != this.status) eh.emit('session.status.change', this, this.status);

        return allReady;
    };

    PlaySession.prototype.startGame = function (userId) {

        if (this.owner.toString() != userId.toString()) return eh.emit('session.unable.start', this, sUtils.reason.SESSION_NOT_OWNED);
        if (this.status == sUtils.status.COUNTDOWN || this.status == sUtils.status.IN_PROGRESS) return eh.emit('session.unable.start', this, sUtils.reason.SESSION_IN_PROGRESS);
        if (!this._checkAllReady()) return eh.emit('session.unable.start', this, sUtils.reason.SESSION_NOT_READY);

        return this._countDown(5, 1000);
    };

    /**
     * Starts countdown
     * @param count - count length
     * @param tick - tick in miliseconds
     * @private
     */
    PlaySession.prototype._countDown = function (count, tick) {
        this.status = sUtils.status.COUNTDOWN;
        var that = this;

        function _tick() {
            eh.emit('session.countdown.tick', that, count);
            count -= 1;

            if (count > 0) {
                setTimeout(_tick, tick)
            }
            else {
                that.status = sUtils.status.IN_PROGRESS;
                eh.emit('session.game.start', that);
            }
        }

        setTimeout(_tick, tick);
    }


    PlaySession.prototype.clientEvent = function(userId, event) {
        Session.prototype.clientEvent.call(this, userId, event);

        if (event == 'user.ready') return this._setUserStatus(userId, sUtils.status.READY);
        if (event == 'user.unready') return this._setUserStatus(userId, sUtils.status.NOT_READY);
        if (event == 'game.start') return this.startGame(userId);
        if (event == 'game.pause') return this.pause();
        if (event == 'game.resume') return this.resume();
    };

}).call(this);

