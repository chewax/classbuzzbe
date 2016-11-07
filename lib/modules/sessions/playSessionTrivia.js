(function(){
    'use strict';

    var PlaySession = require('./playSession');
    var sUtils = require('./sessionUtils');
    var eh = require('../core/eventsHandler');
    var _ = require('lodash');
    var Trivia = require('../trivias/triviaModel');
    var User = require('../users/userModel');

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
     * Should be called everytime a user answers a question.
     * Controlls corectness of the answer and adds points to the user score
     * @param userId
     * @param eventData
     */
    PlaySessionTrivia.prototype.answer = function(userId, eventData) {
        if (eventData.answer == this.currentQuestion.correctAnswer) {
            var uIdx = _.findIndex(this.connected, function(c){ c.user._id.toString == userId.toString() });
            this.connected[uIdx].user.score += this.currentQuestion.points;
        }
    };

    /**
     * Should be called to link a session to a trivia object.
     * @param {string} userId - The user that called the event
     * @param {object} eventData - The event data. An object containing the trivia id.
     */
    PlaySessionTrivia.prototype.selectTrivia = function(userId, eventData) {
        var that = this;
        Trivia.findOne({_id: eventData.triviaId})
            .lean(true)
            .populate('eligibleChests')
            .then(function(trivia){
                that.trivia = trivia;
            })
    };

    /**
     * Overrides PlaySession._onCoundDownFinish
     * @private
     */
    PlaySessionTrivia.prototype._onCountdownFinish = function(){
        PlaySession.prototype._onCountdownFinish.call(this);
        this._trivia();
    };

    /**
     * Starts the trivia game.
     * For each trivia question
     * @emits session.trivia.question
     * With corresponding timeouts
     * When questions are finished, calls _onTriviaFinish()
     * @private
     */
    PlaySessionTrivia.prototype._trivia = function() {
        var questionCount = this.trivia.questions.length;
        var qIdx = 0;   //question index.

        var that = this;

        nextQuestion();
        function nextQuestion() {
            if (qIdx > questionCount) that._onTriviaFinish();

            var question = that.trivia.questions[qIdx];
            eh.emit('session.trivia.question', that, question);
            that.currentQuestion = question;

            qIdx += 1;
            setTimeout(nextQuestion, question.timeLimit * 1000);
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
        var winner = usrArr[0];
        this._applyReward(winner);
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
