(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var deepPopulate = require('mongoose-deep-populate')(mongoose);

    var eventSchema = new mongoose.Schema({

            user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
            house: {type: mongoose.Schema.Types.ObjectId, ref: 'House'},
            branch: {type: mongoose.Schema.Types.ObjectId, ref: 'Branch'},
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer'},

            activity: {type: mongoose.Schema.Types.ObjectId, ref: 'Activity', default: null},
            quest: {type: mongoose.Schema.Types.ObjectId, ref: 'Quest', default: null},
            achievement: {type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', default: null},
            item: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default: null},
            skill: {type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default: null},
            newRank: {type: mongoose.Schema.Types.ObjectId, ref: 'Rank', default: null},

            giver: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null}, // Teacher granting the activity if exists
            timestamp: { type : Date, default: Date.now },

            type: {type:String, enum:['activity', 'quest', 'purchase', 'achievement', "levelup", "skilllevelup", "statusMailOpened"], default:'activity'}, //XP, activity, ETC
            description: {type: String, default: ""},
            xpAward: { type : Number, default: null },
            houseAward: { type : Number, default: null },
            moneyGained: { type : Number, default: null },
            moneySpent: { type : Number, default: null },
            newLevel: {type: Number, default: null},

            showOnFeed: {type: Boolean, default: true}

            },

            { collection: 'Events' }

    );

    var options = {
        populate: {
            'activity': {select: 'name detail skills rank customer reward'},
            'activity.skills': {select: 'name'},
            'activity.rank': {select: 'name ordinality'}
        }
    };

    eventSchema.plugin(deepPopulate, options);

    var Event = mongoose.model('Event', eventSchema);

    module.exports =  Event;

}).call(this);
