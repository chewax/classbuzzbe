(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');
    var goalModel = require('../quests/questGoalModel');
    var _ = require('lodash');

    var activityReward = new mongoose.Schema({
        money: {type:Number, default: 0},
        xp: {type:Number, default: 0}
    });

    var activityLocale = new mongoose.Schema({
        key: {type: String},
        name: {type: String},
        detail: {type: String}
    });

    var activitySchema = new mongoose.Schema({
            name: {type:String},
            detail: {type: String},
            skills: [{type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default:null}],       //Which are the related skills for this activity.
            rank: {type: mongoose.Schema.Types.ObjectId, ref: 'Rank', default: null},           //What rank this activity must appear in. If null --> allRanks
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null},   //Activity customer
            reward: activityReward,
            locales: [activityLocale]
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

    /**
     * Get locale translations for given activity
     * @param key - locale key: 'es', 'en', 'fr', etc.
     */
    activitySchema.methods.locale = function (key) {
        return _.find(this.locales, {key: key});
    };

    activitySchema.plugin(mongoosePaginate);
    module.exports =  mongoose.model('Activity', activitySchema);

}).call(this);
