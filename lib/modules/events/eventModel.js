(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var activityModel = require('../activities/activityModel');

    var eventSchema = new mongoose.Schema({

            user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
            house: {type: mongoose.Schema.Types.ObjectId, ref: 'House'},
            branch: {type: mongoose.Schema.Types.ObjectId, ref: 'Branch'},
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer'},

            activity: {type: mongoose.Schema.Types.ObjectId, ref: 'activity', default: null},
            giver: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null}, // Teacher granting the activity if exists
            timestamp: { type : Date, default: Date.now },

            type: {type:String, default:'XP Award'}, //XP, activity, ETC
            description: String,
            xpAward: { type : Number, default: 0 },
            houseAward: { type : Number, default: 0 }

            },
            { collection: 'Events' }

    );

    eventSchema.post('save', function(doc, next){
        activityModel.findOne({_id:doc.activity})
            .then(function(ach){
                ach.usageCount += 1;
                return ach.save();
            })
            .then(function(result){
                next();
            })
            .catch(function(err){
                next(err);
            })
    });

    var Event = mongoose.model('Event', eventSchema);

    module.exports =  Event;

}).call(this);
