(function () {
    'use strict';

    var notificationModel = require("./notificationModel");
    var eh = require('../core/eventsHandler');
    var errorHandler = require('../errors/errorHandler');

    module.exports.remove = function(req, res){
        notificationModel.findOneAndRemove({_id:req.body._id})
            .then (function (result) { res.status(200).json(result);})
            .catch(function (err) {errorHandler.handleError(err, req, res)});
    };

    module.exports.markAsRead = function(req, res){
        notificationModel.findOne({_id:req.body._id})
            .then (function (message) {
                message.isRead = true;
                return message.save();
            })
            .then (function (result) { res.status(200).json(result);})
            .catch(function (err) {errorHandler.handleError(err, req, res)});
    };


    module.exports.findByUser = function(req, res) {
        notificationModel.find({user: req.params.id})
            .then( function (results){ res.status(200).json(results); })
            .catch(function (err) { errorHandler.handleError(err, req, res)});

    };

    /**
     * Creates a notification for the questcompleted
     * and broadcast the event so that socketIO controller can push the notification
     */
    eh.on('questcompleted', function(user, quest){

        var newNotification = new notificationModel();
        newNotification.user = user._id;
        newNotification.title = "Quest Completed!";
        newNotification.type = "questCompleted";
        newNotification.message = "You have earned " + quest.reward.money + " gold doubloons. Go to the store to spend them.";
        newNotification.detail = {
            quest: quest._id
        };

        newNotification.save()
            .then(function(notification){
                return notification.populate('detail.quest');
            })
            .then(function(notification){
                eh.emit('newnotification', user, notification);  //Emit quest completed notification
            })
            .catch(function(err){
                errorHandler.handleError(err);
            });

    });

    /**
     * Creates a notification for the newquestavailable
     * and broadcast the event so that socketIO controller can push the notification
     */
    eh.on('newquestavailable', function(user, quest){
        var newNotification = new notificationModel();
        newNotification.user = user._id;
        newNotification.title = "New Quest Available!";
        newNotification.message = quest.name;
        newNotification.type = "newQuest";
        newNotification.detail = {
            quest: quest
        };

        newNotification.save()
            .then(function(notification){
                return notificationModel.populate(notification, 'detail.quest');
            })
            .then(function(notification){
                eh.emit('newnotification', user, notification);  //Emit quest completed notification
            })
            .catch(function(err){
                errorHandler.handleError(err);
            })

    });

    /**
     * Creates a notification for the traitacquired
     * and broadcast the event so that socketIO controller can push the notification
     */
    eh.on('traitacquired', function(user, trait) {
        var newNotification = new notificationModel();
        newNotification.user = _user._id;
        newNotification.title = "Trait Acquired!";
        newNotification.message = 'You have successfully purchased ' + trait.name;
        newNotification.type = "newTrait";
        newNotification.detail = {
            trait: trait
        };

        newNotification.save()
            .then(function(notification){
                return notificationModel.populate(notification, 'detail.trait');
            })
            .then(function(notification){
                eh.emit('newnotification', user, notification);  //Emit quest completed notification
            })
            .catch(function(err){
                errorHandler.handleError(err);
            });

    });

    /**
     * Creates a notification for the activitycompleted
     * and broadcast the event so that socketIO controller can push the notification
     */
    eh.on('activitycompleted', function(user, activity) {

        var newNotification = new notificationModel();
        newNotification.user = user._id;
        newNotification.title = "Activty Completed!";
        newNotification.message = 'You have successfully completed ' + activity.name;
        newNotification.type = "activityCompleted";
        newNotification.detail = {
            activity: activity
        };

        newNotification.save()
            .then(function(notification){
                return notificationModel.populate(notification, 'detail.activity');
            })
            .then(function(notification){
                eh.emit('newnotification', user, notification);  //Emit quest completed notification
            })
            .catch(function(err){
                errorHandler.handleError(err);
            });
    });

    /**
     * Creates a notification for the skilllevelup
     * and broadcast the event so that socketIO controller can push the notification
     */
    eh.on('skilllevelup', function(user, skill, newRank) {

        var newNotification = new notificationModel();
        newNotification.user = user._id;
        newNotification.title = "Skill level up!";
        newNotification.message = 'You have leveled up ' + skill.name + '. Your new rank is: ' + newRank.name;
        newNotification.type = "skillLevelUp";
        newNotification.detail = {
            skill: skill
        };

        newNotification.save()
            .then(function(notification){
                return notificationModel.populate(notification, 'detail.skill');
            })
            .then(function(notification){
                eh.emit('newnotification', user, notification);  //Emit quest completed notification
            })
            .catch(function(err){
                errorHandler.handleError(err);
            });
    });

    /**
     * Creates a notification for the achievementunlocked
     * and broadcast the event so that socketIO controller can push the notification
     */
    eh.on('achievementunlocked', function(user, achievement) {

        var newNotification = new notificationModel();
        newNotification.user = user._id;
        newNotification.title = "Achievement unlocked!";
        newNotification.message = 'You have unlocked a new achievement: ' + achievement.name;
        newNotification.type = "achievementUnlocked";
        newNotification.detail = {
            achievement: achievement
        };

        newNotification.save()
            .then(function(notification){
                return notificationModel.populate(notification, 'detail.achievement');
            })
            .then(function(notification){
                eh.emit('newnotification', user, notification);  //Emit quest completed notification
            })
            .catch(function(err){
                errorHandler.handleError(err);
            });

    });

    /**
     * Creates a notification for the goalcompleted
     * and broadcast the event so that socketIO controller can push the notification
     */
    eh.on('goalcompleted', function(user, goal) {

        var newNotification = new notificationModel();
        newNotification.user = user._id;
        newNotification.title = "Goal Completed";
        newNotification.message = 'You have fulfilled a goal: ' + goal.name;
        newNotification.type = "goalFulfilled";
        newNotification.detail = {
            goal: goal
        };

        newNotification.save()
            .then(function(notification){
                return notificationModel.populate(notification, 'detail.goal');
            })
            .then(function(notification){
                eh.emit('newnotification', user, notification);  //Emit quest completed notification
            })
            .catch(function(err){
                errorHandler.handleError(err);
            });

    });


    /**
     * Creates a notification for the incomingbirthday
     * and broadcast the event so that socketIO controller can push the notification
     */
    eh.on('incomingbirthday', function(user, birthdayUser) {

        var bDate = new Date(birthdayUser.birthday);
        var newNotification = new notificationModel();

        console.log('incoming birthday');

        //User == teacher...so notify the teacher.
        //Message for teacher
        newNotification.user = user._id;
        newNotification.title = "Incoming Birthday";
        newNotification.message = birthdayUser.fullName + ' on ' + bDate.getDate() +'/' + (bDate.getMonth() + 1); //months 0-11
        newNotification.type = "incomingBirthday";
        newNotification.detail = {
            user: birthdayUser
        };

        newNotification.save()
            .then(function(notification){
                return notificationModel.populate(notification, 'detail.user');
            })
            .then(function(notification){
                eh.emit('newnotification', user, notification);  //Emit quest completed notification
            })
            .catch(function(err){
                errorHandler.handleError(err);
            });
    });


    /**
     * Creates a notification for the incomingbirthday
     * and broadcast the event so that socketIO controller can push the notification
     */
    eh.on('happybirthday', function(user) {

        //Message for student
        //Only notify the user of the booster if the teacher is null
        var newNotification = new notificationModel();
        newNotification.user = user._id;
        newNotification.title = "Happy Birthday!";
        newNotification.message = "Hey "+user.firstName+", today is your birthday!! " +
            "We want to celebrate by giving you a gold and xp boost for the next 10 days!! " +
            "Make sure you make the most out of them";
        newNotification.type = "incomingBirthday";
        newNotification.detail = {
            user: user
        };

        newNotification.save()
            .then(function(notification){
                return notificationModel.populate(notification, 'detail.user');
            })
            .then(function(notification){
                eh.emit('newnotification', user, notification);  //Emit quest completed notification
            })
            .catch(function(err){
                errorHandler.handleError(err);
            });
    });


    /**
     * Creates a notification for the incomingSpecialEvent
     * and broadcast the event so that socketIO controller can push the notification
     */
    eh.on('incomingspecialevent', function(user, event) {

        var newNotification = new notificationModel();
        newNotification.user = user._id;
        newNotification.title = "Incoming Special Event";
        newNotification.message = 'There is an incoming special event, check your quests for to find out more!';
        newNotification.type = "incomingSpecialEvent";
        newNotification.detail = {
            specialEvent: event
        };

        newNotification.save()
            .then(function(notification){
                eh.emit('newnotification', user, notification);
            })
            .catch(function(err){
                errorHandler.handleError(err);
            });
    });


}).call(this);
