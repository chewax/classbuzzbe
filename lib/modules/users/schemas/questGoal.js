(function(){
    'use strict';

    var mongoose = require('mongoose');

    /**
     * Quest Goals
     * Will Store the Quest Current Goals and Completed Steps
     */
    var questGoal = new mongoose.Schema({
        goal: {type: mongoose.Schema.Types.ObjectId, ref: 'QuestGoal', default: []},
        totalSteps: {type: Number, default: 0},
        completedSteps: {type: Number, default: 0}
    });

    /**
     * QuestGoal Virtual Attribute to find out if a goal is fulfilled
     * Name: isFulfilled.
     */
    questGoal.virtual('isFulfilled').get(function(){
        return (this.totalSteps <= this.completedSteps);
    });

    questGoal.set('toObject', { virtuals: true });
    questGoal.set('toJSON', { virtuals: true });


    module.exports = questGoal;

}).call(this);
