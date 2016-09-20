(function(){
    'use strict';

    var mongoose = require('mongoose');
    var questGoal = require('./questGoal');
    var moment = require('moment');

    /**
     * Character Quests
     * Will store a character quest
     */
    var characterQuest = new mongoose.Schema({
        quest: {type: mongoose.Schema.Types.ObjectId, ref: 'Quest', default: []},
        assigned: {type: Date, default: Date.now },
        completed: {type: Date, default: null},
        goals: [questGoal]
    });

    /**
     * Quest Virtual Attribute to find out if a quest is new or not
     * Name: newQuest.
     */
    characterQuest.virtual('newQuest').get(function(){
        // If its completed no matter how long ago it was assigned, then it is not new
        if (this.completed != null) return false;

        // If it was assigned today, then its new.
        return (moment().startOf('day') < this.assigned);
    });


    /**
     * Quest Virtual Attribute to find out quest progress
     * Name: progress.
     */
    characterQuest.virtual('progress').get(function(){
        var _totalSteps = 0;
        var _completedSteps = 0;

        this.goals.forEach(function(g){
            _totalSteps += g.totalSteps;
            _completedSteps += g.completedSteps;
        });

        return {
            totalSteps: _totalSteps,
            completedSteps: _completedSteps
        }
    });

    /**
     * Quest Virtual Attribute to find out if a quest is completed or not
     * Takes into account the completed timestime. But in case is completed and the timestamp hasnt been updated
     * It loops through the goals and checks if all goals are fulfilled.
     * Name: newQuest.
     */
    characterQuest.virtual('isCompleted').get(function(){
        //If it has a completed date set, then is completed.
        if (this.completed != null) return true;

        //Else loop through goals to see if they are fulfilled
        var _isCompleted = true;

        this.goals.forEach(function(g){
            _isCompleted = _isCompleted && g.isFulfilled;
        });

        return _isCompleted;
    });

    characterQuest.set('toObject', { virtuals: true });
    characterQuest.set('toJSON', { virtuals: true });

    module.exports = characterQuest;

}).call(this);

