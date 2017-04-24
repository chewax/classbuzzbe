(function(){
    'use strict';

    var PlaySession = require('./playSession');
    var User = require('../users/userModel');
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
        this.questionPoints = 10;
        this.rebound = [];

    }

    //PlaySessionPulse inherits from PlaySession.
    PlaySessionPulse.prototype = Object.create(PlaySession.prototype);
    PlaySessionPulse.prototype.constructor = PlaySessionPulse;

    /**
     * Handles pulse event.
     * @param {string} userId - the Id of the user that pulsed
     * @param {object} eventData - Additional event data
     */
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

        eh.emit('session.pulse.pulse', this, this.connected[uIdx].user);
    };

    /**
     * Applies question reward (only XP)
     * @param user
     * @param xp
     * @private
     */
    PlaySessionPulse.prototype._applyReward = function(user, xp) {
        
        if (_.isNil(user)) return
        var reward = {xp:xp, money:0};

        var cIdx =_.findIndex(this.connected, function(elem){
            return elem.user._id.toString() == user._id.toString();
        });        

        if (cIdx != -1) {
            this.connected[cIdx].user.score += xp;
        }

        User.findOne({_id:user._id})
            .then(function(user){
                user.applyReward(reward);
            })
    };

    /**
     * Rolls a new user from te available rebound users.
     * @returns {user}
     * @private
     */
    PlaySessionPulse.prototype._rollReboundUser = function () {
        var rIdx = _.random(0, this.rebound.length - 1);
        var roll = this.rebound.splice(rIdx, 1);
        return roll[0].user;
    };

    /**
     * Resets the status for the next question and
     * @emits 'session.pulse.question' event to let know a new question has been fired.
     */
    PlaySessionPulse.prototype.nextQuestion = function () {
        this.pulserUser = {};
        this.rebound = [];
        this.questionPoints = 10;
        this.status = sUtils.status.PAUSED;
        eh.emit('session.pulse.question.answered', this);
    };

    /**
     * Sets new value for current question and puts the state in progress
     * @emits 'session.pulse.question' event to let know a new question has been fired.
     */
    PlaySessionPulse.prototype.ask = function (userId, eventData) {
        this.pulserUser = {};
        this.rebound = [];
        this.questionPoints = eventData.questionPoints;
        this.status = sUtils.status.IN_PROGRESS;
        eh.emit('session.pulse.question', this);
    };

    /**
     * Grades the user answer.
     * @param {string} userId - the Id of the user that pulsed
     * @param {object} eventData - Additional event data
     */
    PlaySessionPulse.prototype.evaluateAnswer = function(userId, eventData) {
        if (this.status != sUtils.status.PULSED) return; //Cannot answer/evaluate a game that has not been pulsed

        if (eventData.correct) {
            console.log("EVALUATING ANSWER =====");
            console.log(this.pulserUser);
            //Apply reward and emit event to let everyone know
            this._applyReward( this.pulserUser, this.questionPoints);
            eh.emit('session.pulse.correct', this, this.pulserUser);
            this.nextQuestion();
        } 
        else {
            //Apply (negative) reward
            this._applyReward( this.pulserUser, Math.abs(this.questionPoints) * -1);
            this.questionPoints -= 2;

            console.log(this.rebound);
            //No more users to rebound...next question
            if (this.rebound.length <= 0) return this.nextQuestion();
            //If below zero, rebound is over...next question
            if (this.questionPoints <= 0) return this.nextQuestion();

            var reboundUser = this._rollReboundUser();
            this.pulserUser = reboundUser;

            eh.emit('session.pulse.rebound', this, reboundUser);
        }
    };

    /**
     * Handles a client originated event
     * @param {string} userId - the Id of the user that pulsed
     * @param {string} event - the name of the event
     * @param {object} eventData - Additional event data
     */
    PlaySessionPulse.prototype.clientEvent = function(userId, event, eventData) {
        PlaySession.prototype.clientEvent.call(this, userId, event, eventData);

        if (event == 'pulse.pulse') return this.pulse(userId, eventData);
        if (event == 'pulse.pulse.evaluate') return this.evaluateAnswer(userId, eventData);
        if (event == 'pulse.pulse.ask') return this.ask(userId, eventData);
    };

}).call(this);

