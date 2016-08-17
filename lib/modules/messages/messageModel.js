(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;

    var messageSchema = new mongoose.Schema({
            user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
            title: {type:String},
            message: {type:String},
            type: {type:String, enum:[ "newQuest", "questCompleted", "achievementUnlocked", "activityCompleted", "goalFulfilled", "newTrait" ], default:"questCompleted"},
            isRead: {type:Boolean, default:false},
            timestamp: { type : Date, default: Date.now }
        },

        { collection: 'Messages' }
    );

    var Message = mongoose.model('Message', messageSchema);

    module.exports =  Message;

}).call(this);
