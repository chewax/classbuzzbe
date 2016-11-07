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

        //TODO Add question points to constructor.
        this.pulserUser = {};
        this.questionPoints = 100;
        this.rebound = [];

    }

    //PlaySessionPulse inherits from PlaySession.
    PlaySessionPulse.prototype = Object.create(PlaySession.prototype);
    PlaySessionPulse.prototype.constructor = PlaySessionPulse;


    PlaySessionPulse.prototype.pulse = function(userId, eventData) {

        if (this.status != sUtils.status.IN_PROGRESS) return; //Cannot pulse a game that is not in progress.
        this.status = sUtils.status.PULSED;

        var uIdx = _.findIndex(this.connected, function(c) { return c.user._id.toString() == userId.toString()});
        this.pulserUser = this.connected[uIdx].user;

        //Reset rebound and fill with connected users.
        // skip owner -> i == 0
        // skip pulser -> i == idx
        this.rebound = [];
        for (var i = 1; i < this.connected.length; i++) {
            if (i == uIdx) continue;
            this.rebound.push(this.connected[i]);
        }

        eh.emit('session.game.pulse', this, this.connected[uIdx].user);
    };


    PlaySessionPulse.prototype._applyReward = function(user, xp) {
        //TODO Apply Reward
    };

    PlaySessionPulse.prototype._rollReboundUser = function () {
        var rIdx = _.random(0, this.rebound.length - 1);
        var roll = this.rebound.splice(rIdx, 1);
        return roll[0].user;
    };

    PlaySessionPulse.prototype._nextQuestion = function () {
        //TODO What to do to transition to next question. I guess change the status and other cool stuff.
    };


    PlaySessionPulse.prototype.evaluateAnswer = function(userId, eventData) {
        if (this.status != sUtils.status.PULSED) return; //Cannot answer/evaluate a game that has not been pulsed

        if (eventData.correct) {
            //Apply reward and emit event to let everyone know
            this._applyReward( this.pulserUser, this.questionPoints);
            eh.emit('session.game.pulse.correct', this, this.pulserUser);

            //Back to default values to next question.
            this.pulserUser = {};
            this.rebound = [];
            this.questionPoints = 100;
            this.status = sUtils.status.IN_PROGRESS;
        }

        if (!eventData.correctAnswer) {
            //Apply (negative) reward
            this._applyReward( this.pulserUser, Math.abs(this.questionPoints) * -1);
            this.questionPoints -= 20;

            //If below zero, rebound is over.
            if (this.questionPoints <= 0) return this._nextQuestion();

            var reboundUser = this._rollReboundUser();
            this.pulserUser = reboundUser;

            eh.emit('session.game.rebound', this, reboundUser);
        }
    };

    PlaySessionPulse.prototype.clientEvent = function(userId, event, eventData) {
        PlaySession.prototype.clientEvent.call(this, userId, event, eventData);

        if (event == 'game.pulse') return this.pulse(userId, eventData);
        if (event == 'game.pulse.evaluate') return this.evaluateAnswer(userId, eventData);
    };

}).call(this);

