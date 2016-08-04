(function () {
    'use strict';

    var messageModel = require("./messageModel");
    var eh = require('../core/eventsHandler');
    var errorHandler = require('../errors/errorHandler');
    var mongoose = require('../../database').Mongoose;

    module.exports.remove = function(req, res){
        messageModel.findOneAndRemove({_id:req.body._id})
            .then (function (result) { res.status(200).json(result);})
            .catch(function (err) {errorHandler.handleError(err, req, res)});
    };

    module.exports.markAsRead = function(req, res){
        messageModel.findOne({_id:req.body._id})
            .then (function (message) {
                message.isRead = true;
                return message.save();
            })
            .then (function (result) { res.status(200).json(result);})
            .catch(function (err) {errorHandler.handleError(err, req, res)});
    };


    module.exports.findByUser = function(req, res) {

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            res.status(400).json({ message: "Invalid _id"});
            return;
        }

        messageModel.find({user: req.params.id})
            .then( function (results){ res.status(200).json(results); })
            .catch(function (err) { errorHandler.handleError(err, req, res)});

    };

    /**
     * Creates a notification for the questcompleted
     * and broadcast the event so that socketIO controller can push the notification
     */
    eh.on('questcompleted', function(user, quest){
        var newMessage = new messageModel();
        newMessage.user = user._id;
        newMessage.title = "Quest Completed!";
        newMessage.type = "questCompleted";
        newMessage.message = "You have earned " + quest.reward + " gold doubloons. Go to the store to spend them.";
        newMessage.save();
        eh.emit('newnotification', user, newMessage);  //Emit quest completed notification

    })

    /**
     * Creates a notification for the activity award
     * and broadcast the event so that socketIO controller can push the notification
     */
    eh.on('activityaward', function(user, activity) {

        var newMessage = new messageModel();
        newMessage.title = 'activity Unlocked: ' + activity.name;
        newMessage.type = "activityUnlocked";
        newMessage.message = "You have unlocked a new activity and earned " + activity.xpAward + 'XP.';

        if (activity.type == 'penalty') {
            newMessage.title = 'Penalization: ' + activity.name;
            newMessage.type = "penaltyactivity";
            newMessage.message = "You have received a penalization and have forfeited " + activity.xpAward + 'XP.';
        }

        newMessage.user = user._id;
        newMessage.save();
        eh.emit('newnotification', user, newMessage);  //Emit badge earned notification

    })



}).call(this);
