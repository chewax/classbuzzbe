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

    });

    /**
     * Creates a notification for the newquestavailable
     * and broadcast the event so that socketIO controller can push the notification
     */
    eh.on('newquestavailable', function(user, quest){
        var newMessage = new messageModel();
        newMessage.user = user._id;
        newMessage.title = "New Quest Available!";
        newMessage.message = quest.name;
        newMessage.type = "newQuest";
        newMessage.save();
        eh.emit('newnotification', user, newMessage);  //Emit quest completed notification

    });

    eh.on('traitacquired', function(user, trait) {
        var newMessage = new messageModel();
        newMessage.user = _user._id;
        newMessage.title = "Trait Acquired!";
        newMessage.message = 'You have successfully purchased ' + trait.name;
        newMessage.type = "newTrait";
        newMessage.save();

        eh.emit('newnotification', user, newMessage);
    });



    //TODO This.
    /**
     * Creates a notification for the activity award
     * and broadcast the event so that socketIO controller can push the notification
     */
    eh.on('activitycompleted', function(user, activity) {});
    eh.on('skilllevelup', function(user, skill, newRank) {});
    eh.on('achievementunlocked', function(user, achievement) {});
    eh.on('goalcompleted', function(user, goal) {});



}).call(this);
