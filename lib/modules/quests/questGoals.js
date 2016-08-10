(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    //TODO Add Items and Rewards to goals...for now only Activity Goal
    var goalSchema = new mongoose.Schema({
            name: {type:String},
            type: {type:String, enum: ['Activity', 'Item', 'Reward'], default: 'Activity'},
            amount: {type:Number, default:1},
            skill: {type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default: null},         //Which is the related skill for this goal. Used to check if completed activity matches the goal.
            activity: {type: mongoose.Schema.Types.ObjectId, ref: 'Activity', default: null},   //If null then is any activity of the skill otherwise goal is that particular activity.
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null}    //Activity customer
        },

        { collection: 'QuestGoals' }
    );

    goalSchema.plugin(mongoosePaginate);
    module.exports = mongoose.model('QuestGoals', goalSchema);

}).call(this);
