(function(){
    'use strict';

    var mongoose = require('mongoose');

    var triviaAnswer = new mongoose.Schema({
        type: {type:String, enum:["picture, text"]},
        text: {type:String, default:""}
    });

    /**
     * Trivia Question
     */
    var triviaQuestion = new mongoose.Schema({
        question: {type: String, default: ""},
        answers: [triviaAnswer],
        correctAnswer: {type:Number, default:null},
        timeLimit: {type:Number, default:5}, //seconds...if -1 then no limit.
        points: {type:Number, default: 10}
    });


    module.exports = triviaQuestion;

}).call(this);
