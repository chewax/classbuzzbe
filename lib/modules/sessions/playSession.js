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
     * Only owner can pause session
     * Only an in_progress session can be paused
     * @param {string} userId - User that is intending to pause session
     * @emits session.status.change
     */
    PlaySession.prototype.pause = function(userId) {

        //Dont allow to pause if not owner.
        if (this.owner.toString() != userId.toString()) return;

        // Don't allow to pause if not in progress
        if (this.status != sUtils.status.IN_PROGRESS) return;

        this.status = sUtils.status.PAUSED;
        eh.emit('session.status.change', this, this.status);
    };

    /**
     * Resumes session activity
     * Only owner can resume a paused session
     * Only a paused or pulsed session can be resumed
     * @param {string} userId - User that is intending to resume
     * @emits session.status.change
     *
     */
    PlaySession.prototype.resume = function(userId) {
        // Don't allow to resume if not owner.
        if (this.owner.toString() != userId.toString()) return;

        // Don't allow to resume if not paused or pulsed
        if (this.status == sUtils.status.PAUSED || this.status == sUtils.status.PULSED) {
            this.status = sUtils.status.IN_PROGRESS;
            eh.emit('session.status.change', this, this.status);
        }
        
    };

    /**
     * Checks if all connected users are ready. If so, broadcast message.
     * @emits session.status.change
     * @private
     */
    PlaySession.prototype._checkAllReady = function () {
        var allReady = true;

        this.connected.forEach(function(elem, idx, arr){
            allReady = allReady && (elem.status == sUtils.status.READY);
        });

        var previousStatus = this.status;

        if (allReady) this.status = sUtils.status.READY;
        if (!allReady) this.status = sUtils.status.WAITING;

        if (previousStatus != this.status) eh.emit('session.status.change', this, this.status);

        return allReady;
    };

    /**
     * Triggers the "start game" process if possible.
     * 1. Starting user must be session owner.
     * 2. All participants must be ready.
     * 3. Session must not be already in progress or countdown
     *
     * Finally starts countdown.
     * @param userId
     * @emits session.unable.start
     *
     * @returns {*}
     */
    PlaySession.prototype.startGame = function (userId) {

        if (this.owner.toString() != userId.toString()) return eh.emit('session.unable.start', this, sUtils.reason.SESSION_NOT_OWNED);
        if (this.status == sUtils.status.COUNTDOWN || this.status == sUtils.status.IN_PROGRESS) return eh.emit('session.unable.start', this, sUtils.reason.SESSION_IN_PROGRESS);
        if (!this._checkAllReady()) return eh.emit('session.unable.start', this, sUtils.reason.SESSION_NOT_READY);

        return this._startCountdown(5, 1000);
    };

    /**
     * Callback when countdown finishes. To be overriden with corresponding behaviour
     * @private
     */
    PlaySession.prototype._onCountdownFinish = function() {
        eh.emit('session.countdown.finish', this)
    };

    /**
     * Callback when countdown finishes. To be overriden with corresponding behaviour
     * @emits Global#session.coundown.tick
     * @private
     */
    PlaySession.prototype._onCountdownTick = function(count) {
        this.emit('countdown.tick', count);
        eh.emit('session.countdown.tick', this, count);
    };

    /**
     * Starts countdown
     * @param {number} count - count length
     * @param {number} tick - tick in miliseconds
     *
     * @emits Global#session.game.start
     * @emits PlaySession#countdown.finish
     *
     * Calls _onCountdownTick function. Intentded to be overriden by custom behaviour on coundown.
     * @private
     */
    PlaySession.prototype._startCountdown = function (count, tick) {
        this.status = sUtils.status.COUNTDOWN;
        var self = this;

        function _tick() {
            self._onCountdownTick.call(self, count);

            count -= 1;

            if (count >= 0) {
                setTimeout(_tick, tick)
            }
            else {
                self.status = sUtils.status.IN_PROGRESS;
                eh.emit('session.game.start', self);
                self.emit('countdown.finish');
                self._onCountdownFinish.call(self);
            }
        }

        setTimeout(_tick, tick);
    };


    PlaySession.prototype.clientEvent = function(userId, event, eventData) {
        Session.prototype.clientEvent.call(this, userId, event, eventData);

        if (event == 'user.ready') return this._setUserStatus(userId, sUtils.status.READY);
        if (event == 'user.unready') return this._setUserStatus(userId, sUtils.status.NOT_READY);
        if (event == 'game.start') return this.startGame(userId);
        if (event == 'game.pause') return this.pause(userId);
        if (event == 'game.resume') return this.resume(userId);
    };

}).call(this);

