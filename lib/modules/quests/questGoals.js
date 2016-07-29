(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    var goalSchema = new mongoose.Schema({
            name: {type:String},
            type: {type:String, enum: ['Activity', 'Item', 'Reward'], default: 'Activity'},
            amount: {type:Number, default:1},
            skill: {type: mongoose.Schema.Types.ObjectId, ref: 'Skill'},                        //Which is the related skill for this goal. Used to check if completed activity matches the goal.
            //TODO Add Items and Rewards to goals...for now only Activity Goal
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null}    //Activity customer
        },

        { collection: 'QuestGoals' }
    );

    goalSchema.plugin(mongoosePaginate);
    module.exports = mongoose.model('QuestGoals', goalSchema);

}).call(this);
