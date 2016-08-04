(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    var activityReward = new mongoose.Schema({
        money: {type:Number, default: 0},
        xp: {type:Number, default: 0}
    });

    var activitySchema = new mongoose.Schema({
            name: {type:String},
            detail: {type: String},
            skill: {type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default:null},          //Which is the related skill for this activity.
            rank: {type: mongoose.Schema.Types.ObjectId, ref: 'Rank', default: null},           //What rank this activity must appear in. If null --> allRanks
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null},   //Activity customer
            reward: activityReward
        },
        { collection: 'Activities' }
    );

    activitySchema.plugin(mongoosePaginate);
    module.exports =  mongoose.model('Activity', activitySchema);

}).call(this);
