(function () {
    'use strict';

    var config = require('../../config');
    var messages = require('../core/systemMessages');
    var eventModel = require('./eventModel');
    var userModel = require('../users/userModel');
    var utils = require('../core/utils');
    var errorHandler = require('../errors/errorHandler');
    var eh = require('../core/eventsHandler');
    var _ = require('underscore');
    var mongoose = require('../../database').Mongoose;
    var houseController = require("../houses/houseController");

    module.exports.apiCreate = function (req, res) {
        createEvent(req.body.userId, req.body.type, req.body.dsc, req.body.xpAward, null, req.user.id)
            .then (function (result) { utils.handleSuccess(messages.success.onAction('Create Event'), res); })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    /**
     * Creates a new event - Returns Promise
     * @param userId
     * @param houseId
     * @param type
     * @param dsc
     * @param xpAward
     * @returns {Promise}
     */
    var createEvent = function(userId, type, dsc, xpAward, activityId, giverId) {

        if (_.isUndefined(activityId)) activityId = null;
        if (_.isUndefined(giverId)) giverId = null;
        if (_.isUndefined(xpAward) || _.isNull(xpAward)) xpAward = 0;

        var _user;

        return userModel.findOne({_id: userId})
            .then(function (user) {

                _user = user;
                return houseController.getXPAward(user.customer, user.student.house, xpAward);
            })

            .then(function(houseXpAward){

                var eventObj = {
                    user: _user._id,
                    house: _user.student.house,
                    customer: _user.customer,
                    branch: _user.branches[0],
                    activity: activityId,
                    giver: giverId,
                    type: type,
                    timestamp: Date.now(),
                    description: dsc,
                    xpAward: xpAward,
                    houseAward: houseXpAward
                };

                var newEvent = new eventModel(eventObj);
                return newEvent.save();

            })
            .then (function (newEvent) {
                newEvent.populate("house activity", function(err) {

                    newEvent.populate("user", "doc firstName lastName email avatarURL", function(err) {
                        eh.emit('newevent', newEvent);
                        return newEvent;
                    })

                })

            })
            .catch(function (err) { errorHandler.handleError(err, req, res) });
    }

    module.exports.create =  createEvent;


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

}).call(this);
