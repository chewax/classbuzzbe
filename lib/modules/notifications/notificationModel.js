(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;

    var notificationSchema = new mongoose.Schema({
            user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
            title: {type:String},
            message: {type:String},
            type: {
                type:String,
                enum:[  "newQuest", "questCompleted", "achievementUnlocked", "activityCompleted", "skillLevelUp",
                        "goalFulfilled", "newTrait", "incomingBirthday", "incomingSpecialEvent" ],
                default:"questCompleted" },

            detail: {
                quest: {type: mongoose.Schema.Types.ObjectId, ref: 'Quest', default: null},
                skill: {type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default: null},
                achievement: {type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', default: null},
                activity: {type: mongoose.Schema.Types.ObjectId, ref: 'Activity', default: null},
                goal: {type: mongoose.Schema.Types.ObjectId, ref: 'QuestGoal', default: null},
                trait: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default: null},
                user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},                //Birthday user.
                specialEvent: {type: mongoose.Schema.Types.ObjectId, ref: 'SpecialEvent', default: null}
            },

            isRead: {type:Boolean, default:false},
            timestamp: { type : Date, default: Date.now }
        },

        { collection: 'Notifications' }
    );

    var Notification = mongoose.model('Notification', notificationSchema);

    module.exports =  Notification;

}).call(this);
