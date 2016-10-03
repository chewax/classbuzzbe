(function () {
    'use strict';

    var config = require('../../config');
    var messages = require('../core/systemMessages');
    var eventModel = require('./eventModel');
    var userModel = require('../users/userModel');
    var utils = require('../core/utils');
    var errorHandler = require('../errors/errorHandler');
    var mongoose = require('../../database').Mongoose;
    var houseController = require("../houses/houseController");
    var eh = require('../core/eventsHandler');



    module.exports.remove = function (req, res) {
        eventModel.findOneAndRemove({_id: req.body.id})
            .then (function (result) { utils.handleSuccess(messages.success.onDelete("Event"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.update = function (req, res) {

        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;

        eventModel.findOneAndUpdate({_id: element_id}, data)
            .then (function (result) { utils.handleSuccess(messages.success.onAction("Event update"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.find = {
        one: function (req, res) {
            eventModel.findOne({_id: req.params.id})
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        },

        all: function (req, res) {
            eventModel.find()
                .then( function (results){ res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        byCustomer: function(req, res) {
            eventModel.find({customer: req.params.id})
                .sort("-timestamp")
                .populate("house")
                .populate("activity")
                .populate("user", "doc firstName lastName email avatarURL")
                .limit(4)
                .lean()
                .then( function (events){
                    var filteredResult;

                    if (typeof req.body.type == "undefined")
                    {
                        filteredResult = events;
                    }
                    else
                    {
                        filteredResult = events.filter(function(e){
                            return e.activity.type == req.body.type;
                        })
                    }

                    res.status(200).json(filteredResult);

                })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        query: function(req, res) {

            var andFilters = [];
            if (mongoose.Types.ObjectId.isValid(req.body.branch)) andFilters.push({'branch': req.body.branch});
            if (mongoose.Types.ObjectId.isValid(req.body.customer)) andFilters.push({'customer': req.body.customer});
            if (mongoose.Types.ObjectId.isValid(req.body.house)) andFilters.push({'house': req.body.house});

            eventModel.find({$and: andFilters})
                .sort("-timestamp")
                .populate("house")
                .populate("activity")
                .populate("user", "doc firstName lastName email avatarURL")
                .limit(10)
                .lean()
                .then( function (events){
                    res.status(200).json(events);
                })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        lazyLoad: function(req, res) {

            if (typeof req.body.limit == 'undefined') req.body.limit = 30;
            if (typeof req.body.fromIndex == 'undefined') req.body.fromIndex = 0;

            var limit = req.body.limit;
            var fromIndex = req.body.fromIndex;

            var andFilters = [];
            var aggregatePipeline = [];

            if (mongoose.Types.ObjectId.isValid(req.body.customer)) andFilters.push({'customer': mongoose.Types.ObjectId(req.body.customer)});
            andFilters.push({showOnFeed: true});

            aggregatePipeline.push({ $sort:  {timestamp: -1}});
            aggregatePipeline.push({ $match: {$and:andFilters}} );
            aggregatePipeline.push({ $skip:  fromIndex});
            aggregatePipeline.push({ $limit: limit});

            eventModel.aggregate( aggregatePipeline ,function(err, result){
                if (err) errorHandler.handleError(err, req, res);

                eventModel.populate(result, {path:'user house achievement activity quest skill newRank item giver', select:'-credentials'}, function(err, result){
                    if (err) errorHandler.handleError(err, req, res);
                    else res.status(200).json(result);
                })
            });
        }
    }


    /**
     * Creates a new event - Returns Promise
     * @returns {Promise}
     */
    function createEvent(eventData) {

        eventData.house = eventData.user.student.house;
        eventData.customer = eventData.user.customer;
        eventData.branch = eventData.user.branch;
        eventData.timestamp = Date.now();

        var newEvent = new eventModel(eventData);
        newEvent.save()
            .then ( function (newEvent) {
                newEvent.populate("house activity quest achievement item", function (err) {
                    newEvent.populate("user", "doc firstName lastName email avatarURL", function (err) {
                        eh.emit('newevent', newEvent);
                        return newEvent;
                    })
                })
            })
            .catch(function (err) { errorHandler.handleError(err) });
    };



    //EVENTS
    eh.on('levelup', function(user) {
        var level = user.student.character.levelInfo.level;
        var dsc = user.fullName +' has reached level ' + level;

        var _eventData = {
            user: user,
            type: "levelup",
            description: dsc,
            newLevel: level,
            showOnFeed: true
        };

        createEvent(_eventData);
    });

    eh.on('questcompleted', function(user, quest) {
        var dsc = user.fullName +' has completed the quest: ' + quest.name;

        //quest.houseXp is a temorary custom var to hold the house xp value. That value is calculated upon
        //emiting the event. It is intended that way so that only 1 db query is fired. Otherwise it would be done
        //here and on the houseController (so far)

        var _eventData = {
            user: user,
            quest: quest._id,
            xpAward: quest.reward.xp,
            houseAward: quest.houseXp,
            type: "quest",
            description: dsc,
            moneyGained: quest.reward.money,
            showOnFeed: true
        };

        createEvent(_eventData);

    });

    eh.on('activitycompleted', function(user, activity) {
        var dsc = user.fullName +' has completed the activity: ' + activity.name;

        //activity.houseXp is a temorary custom var to hold the house xp value. That value is calculated upon
        //emiting the event. It is intended that way so that only 1 db query is fired. Otherwise it would be done
        //here and on the houseController (so far)

        //activity.giver is a temporary custom var to hold the activity giver.

        var _eventData = {
            user: user,
            activity: activity._id,
            xpAward: activity.reward.xp,
            moneyGained: activity.reward.money,
            houseAward: activity.houseXp,
            giver: activity.giver,
            type: "activity",
            description: dsc,
            showOnFeed: true
        };

        createEvent(_eventData);
    });

    eh.on('traitacquired', function(user, trait) {
        var dsc = user.fullName +' has purchased a new item!';

        var _eventData = {
            user: user,
            type: "purchase",
            description: dsc,
            item: trait._id,
            moneySpent: trait.price,
            showOnFeed: false
        };

        createEvent(_eventData);
    });

    eh.on('skilllevelup', function(user, skill, newRank) {

        var dsc = user.fullName +" has reached '"+ skill.name + " " + newRank.name +"'";

        var _eventData = {
            user: user,
            type: "skilllevelup",
            description: dsc,
            skill: skill._id,
            newRank: newRank._id,
            showOnFeed: true
        };

        createEvent(_eventData);

    });

    eh.on('achievementunlocked', function(user, achievement) {

        var dsc = user.fullName +" has unlocked a new achievement:  '"+ achievement.name +"'";

        var _eventData = {
            user: user,
            achievement: achievement._id,
            type: "achievement",
            description: dsc,
            showOnFeed: true
        };

        createEvent(_eventData);

    });


    eh.on('statusmailopened', function(statusMailRecord) {

        userModel.findOne({_id:statusMailRecord.student})
            .populate('student.house')
            .then(function (user) {

                var _eventData = {
                    user: user,
                    house: user.student.house._id,
                    type: "statusMailOpened",
                    description: user.fullName + "'s parent opened the status mail. XP Awarded to house: " + user.student.house.name,
                    houseAward: config.houses.xpReceivedFromStatusMailOpened,
                    showOnFeed: true
                };

                createEvent(_eventData);
                
            });

    });

}).call(this);
