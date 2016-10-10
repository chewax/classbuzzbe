(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');
    var goalModel = require('../quests/questGoalModel');
    var localePlugin = require('../core/plugins/localesPlugin');

    var activityReward = new mongoose.Schema({
        money: {type:Number, default: 0},
        xp: {type:Number, default: 0}
    });

    var activitySchema = new mongoose.Schema({
            name: {type:String},
            detail: {type: String},
            skills: [{type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default:null}],       //Which are the related skills for this activity.
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null},   //Activity customer
            rank: {type: mongoose.Schema.Types.ObjectId, ref: 'Rank', default: null},           //What rank this activity must appear in. If null --> allRanks
            reward: activityReward
        },
        { collection: 'Activities' }
    );

    /**
     * Returns the goals this activity affects either by the activity itself or its skill.
     */
    activitySchema.methods.affectedGoals = function () {
        var _or = [];
        _or.push({activity: this._id});
        _or.push({skill: {$in: this.skills}});
        return goalModel.find({$or:_or});
    };

    activitySchema.plugin(mongoosePaginate);
    activitySchema.plugin(localePlugin);

    module.exports =  mongoose.model('Activity', activitySchema);

}).call(this);
