(function(){
    'use strict';

    var mongoose = require('mongoose');


    var quizAnswer = new mongoose.Schema({
        type: {type:String, enum:["picture, text"]},
        text: {type:String, default:""}
    });

    /**
     * Quiz Question
     */
    var quizQuestion = new mongoose.Schema({
        question: {type: String, default: ""},
        answers: [quizAnswer],
        correctAnswer: {type:Number, default:null},
        timeLimit: {type:Number, default:10}, //seconds...if -1 then no limit.
    });


    module.exports = quizQuestion;

}).call(this);
