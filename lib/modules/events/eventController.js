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
                .limit(10)
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

            var andFilters = [];
            if (typeof req.body.limit == 'undefined') req.body.limit = 30;
            if (mongoose.Types.ObjectId.isValid(req.body.id)) andFilters.push({_id: {$lt: req.body.id}});
            if (mongoose.Types.ObjectId.isValid(req.body.branch)) andFilters.push({'branch': req.body.branch});
            if (mongoose.Types.ObjectId.isValid(req.body.customer)) andFilters.push({'customer': req.body.customer});
            if (mongoose.Types.ObjectId.isValid(req.body.house)) andFilters.push({'house': req.body.house});

            eventModel.find({$and: andFilters})
                .sort({_id:-1})
                .limit(req.body.limit)
                .populate("house")
                .populate("activity")
                .populate("user", "doc firstName lastName email avatarURL")
                .then( function (events){
                    res.status(200).json(events);
                })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
    }


    /**
     * Creates a new event - Returns Promise
     * @returns {Promise}
     */
    function createEvent(eventData) {

        var _user;

        return userModel.findOne({_id: userId})
            .then(function (user) {

                _user = user;
                return houseController.getXPAward(user.customer, user.student.house, xpAward);
            })

            .then(function(houseXpAward){

                eventData.user = _user._id;
                eventData.house = _user.student.house;
                eventData.customer = _user.customer;
                eventData.branch = _user.branch;
                eventData.timestamp = Date.now();
                eventData.houseAward = houseXpAward;

                var newEvent = new eventModel(eventData);
                return newEvent.save();

            })
            .then (function (newEvent) {
                newEvent.populate("house activity quest achievement item", function(err) {

                    newEvent.populate("user", "doc firstName lastName email avatarURL", function(err) {
                        eh.emit('newevent', newEvent);
                        return newEvent;
                    })
            })

        })
            .catch(function (err) { errorHandler.handleError(err, req, res) });
    };



    //EVENTS
    eh.on('levelup', function(user, xp) {
        var level = utils.getUserLevel(user.student.character.xp + xp);
        var dsc = user.firstName+' '+user.lastName+' has reached level ' + level;

        var _eventData = {
            userId: user._id,
            type: "LevelUp",
            xpAward: xp,
            description: dsc,
            showOnFeed: true
        };

        createEvent(_eventData);
    });

    //TODO Finish this events handlers
    //Should record "Events" for all this systemEvents.
    eh.on('questcompleted', function(user, quest) {

    });
    eh.on('traitacquired', function(user, trait) {});
    eh.on('skilllevelup', function(user, skill, newRank) {});
    eh.on('activitycompleted', function(user, activity) {});
    eh.on('achievementunlocked', function(user, achievement) {});
    eh.on('goalcompleted', function(user, goal) {});

}).call(this);
