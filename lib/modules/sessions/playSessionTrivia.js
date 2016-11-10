(function(){
    'use strict';

    var PlaySession = require('./playSession');
    var sUtils = require('./sessionUtils');
    var eh = require('../core/eventsHandler');
    var _ = require('lodash');
    var Trivia = require('../trivias/triviaModel');
    var User = require('../users/userModel');
    var debug = require('../core/debug');

    module.exports = PlaySessionTrivia;

    /**
     * Creates New Play Session. Inherits from PlaySession.
     * @param userId - User that owns the session
     * @param socketId - User socket id. Most messages will be sent to room (which is identified by the session
     * _id, but if a direct message must be sent we better have the socketId.
     * @param type - The type of session being created. Typically will be play.XXX. Meaning, is a play session of subtype XXX
     */
    function PlaySessionTrivia (userId, socketId, type) {
        PlaySession.call(this, userId, socketId, type);

        this.trivia = {};
        this.currentQuestion = {};
    }

    //PlaySessionPulse inherits from PlaySession.
    PlaySessionTrivia.prototype = Object.create(PlaySession.prototype);
    PlaySessionTrivia.prototype.constructor = PlaySessionTrivia;


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
    PlaySessionTrivia.prototype.startGame = function (userId) {
        if ( _.isEmpty(this.trivia)) return eh.emit('session.unable.start', this, sUtils.reason.TRIVIA_NOT_SELECTED);
        PlaySession.prototype.startGame.call(this, userId);
    };

    /**
     * Should be called everytime a user answers a question.
     * Controlls corectness of the answer and adds points to the user score
     * @param userId
     * @param eventData
     */
    PlaySessionTrivia.prototype.answer = function(userId, eventData) {

        //Cannot answer a game that is not in progress (it might be destroyed or paused);
        if (this.status != sUtils.status.IN_PROGRESS) return;

        //Check if user has already answered this question
        var aIdx = _.findIndex(this.currentQuestion.answered, function(uId){
            return uId.toString() == userId.toString()
        });

        if (aIdx != -1) return; //Already answered;

        if (eventData.answer == this.currentQuestion.correctAnswer) {
            var uIdx = _.findIndex(this.connected, function(c){ return c.user._id.toString() == userId.toString(); });
            this.connected[uIdx].user.score += this.currentQuestion.points;
            this.currentQuestion.answered.push(this.connected[uIdx].user._id);
        }

    };

    /**
     * Should be called to link a session to a trivia object.
     * @param {string} userId - The user that called the event
     * @param {object} eventData - The event data. An object containing the trivia id.
     *
     * @emits session.error
     */
    PlaySessionTrivia.prototype.selectTrivia = function(userId, eventData) {
        if (this.owner.toString() != userId.toString()) return eh.emit('session.error', this, sUtils.error.SESSION_NOT_OWNED);

        var self = this;
        Trivia.findOne({_id: eventData.triviaId})
            .lean(true)
            .populate('eligibleChests')
            .then(function(trivia){
                eh.emit('session.trivia.selected', self);
                self.trivia = trivia;
            })
    };

    /**
     * Overrides PlaySession._onCountDownFinish
     * @private
     */
    PlaySessionTrivia.prototype._onCountdownFinish = function(){
        PlaySession.prototype._onCountdownFinish.call(this);
        this._startTrivia();
    };

    /**
     * Starts the trivia game.
     * For each trivia question
     * @emits session.trivia.question
     * With corresponding timeouts
     * When questions are finished, calls _onTriviaFinish()
     * @private
     */
    PlaySessionTrivia.prototype._startTrivia = function() {
        var questionCount = this.trivia.questions.length;
        var qIdx = 0;   //question index.

        var self = this;

        nextQuestion();

        function nextQuestion() {

            if (self.status == sUtils.status.DESTROYED) return; //If destroyed, return and never come back.
            if (self.status == sUtils.status.PAUSED) return setTimeout(nextQuestion, 1000); //If paused wait for a second and try again

            if (qIdx == questionCount) return self._onTriviaFinish.call(self);

            self.currentQuestion = self.trivia.questions[qIdx];
            eh.emit('session.trivia.question', self, self.currentQuestion);
            self.currentQuestion.answered = [];

            qIdx += 1;
            setTimeout(nextQuestion, self.currentQuestion.timeLimit * 1000);
        }
    };

    /**
     * Gets called when trivia runs out of questions.
     * Processes the trivia results and
     * @emits game.trivia.results
     * With the information of trivia ranking.
     * Upon finish calls _applyRewards with winning user.
     * @private
     */
    PlaySessionTrivia.prototype._onTriviaFinish = function(){
        var usrArr = this.connected.map(function(c) { return c.user });
        usrArr = _.sortBy(usrArr, 'score' ).reverse();

        eh.emit('session.trivia.finish', this);

        //apply rewards to all winners if score > 0
        var winner = usrArr[0];
        if (winner.score <= 0) {
            return eh.emit('session.trivia.winner', this, null);
        };

        var i = 0;

        while (usrArr[i].score == winner.score) {
            this._applyReward(usrArr[i]);
            i++;
        }

    };

    /**
     * Gets called when the trivia result are processed
     * @param {string} userId - The id of the winner user.
     * @private
     */
    PlaySessionTrivia.prototype._applyReward = function(user){
        User.awardChest(user._id, this.trivia.eligibleChests);
        eh.emit('session.trivia.winner', this, user);
    };

    /**
     * Process client events sent through 'session.event' event.
     * @param {string} userId - Id of user that sent the event
     * @param {string} event - The name of the event
     * @param {object} eventData - The data of the event.
     */
    PlaySessionTrivia.prototype.clientEvent = function(userId, event, eventData) {
        PlaySession.prototype.clientEvent.call(this, userId, event, eventData);

        if (event == 'game.trivia.answer') return this.answer(userId, eventData);
        if (event == 'game.trivia.select') return this.selectTrivia(userId, eventData);
    };

}).call(this);
