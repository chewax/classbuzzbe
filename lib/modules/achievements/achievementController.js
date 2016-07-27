(function () {
    'use strict';

    var config = require('../../config');
    var messages = require('../core/systemMessages');
    var achievementModel = require('./achievementModel');
    var questModel = require('../quests/questModel');
    var utils = require('../core/utils');
    var errorHandler = require('../errors/errorHandler');
    var mongoose = require('../../database').Mongoose;
    var _ = require('underscore');

    module.exports.create = function (req, res) {

        var achievement = new achievementModel(req.body);

        //If not provided, then achievement customer will match the logged user customer
        if (_.isNull(achievement.customer)) {
            achievement.customer = req.user.customer;
        }

        achievement.save()
            .then (function (achievement) {

                if (achievement.type == 'reward' && achievement.createsQuest) {

                    //Create new Quest From Achievement
                    var newQuest = new questModel();
                    newQuest.name = "Earn a '" + achievement.name + "' Achievement.";
                    newQuest.reward = achievement.xpAward;
                    newQuest.trigger.type = "achievement";
                    newQuest.trigger.achievement = achievement._id;
                    newQuest.customer = achievement.customer;

                    return newQuest.save();
                }
                else {

                    return new Promise( function(resolve, reject){
                        resolve();
                    });
                }

            })

            .then( function (result) { utils.handleSuccess(messages.success.onCreate("achievement"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function (req, res) {
        questModel.findOneAndRemove({'trigger.achievement':req.body._id})
            .then (function (result) { return achievementModel.findOneAndRemove({_id: req.body._id})})
            .then (function (result) { utils.handleSuccess(messages.success.onDelete("achievement"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.update = function (req, res) {
        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;

        achievementModel.findOneAndUpdate({_id: element_id}, data)
            .then( function(result){
                var newQuestName = "Earn a '" +  data.name + "' achievement.";
                return questModel.findOneAndUpdate({'trigger.achievement':element_id}, {name:newQuestName, reward:data.xpAward})
            })
            .then (function (result) { utils.handleSuccess(messages.success.onAction("achievement update"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.find = {
        all: function(req,res){
            achievementModel.find()
                .and({isActive: true})
                .then( function (results){ res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        one: function(req,res){
            achievementModel.findOne({_id: req.params.id})
                .and({isActive: true})
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        },

        byCustomer: function(req, res) {
            achievementModel.find({customer:req.body.customer})
                .and({isActive: true})
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        },

        autocomplete: function(req,res){

            var re = new RegExp(req.body.searchField, "i"); // i = case insensitive
            var limit = req.body.searchLimit || 5;
            var customer = req.body.customer || "";

            if (limit<=0) {

                achievementModel.find({ name: { $regex: re }})
                    .and({customer: customer})
                    .and({isActive: true})
                    .sort({usageCount: -1})
                    .then(function (results){ res.status(200).json(results) ;})
                    .catch(function (err) { errorHandler.handleError(err, req, res) })

            }

            else {

                achievementModel.find({ name: { $regex: re }})
                    .and({customer: customer})
                    .and({isActive: true})
                    .sort({usageCount: -1})
                    .limit(limit)
                    .then(function (results){ res.status(200).json(results) ;})
                    .catch(function (err) { errorHandler.handleError(err, req, res) })
            }

        },

        paginate: function(req,res){

            var andFilters = [];

            var re = new RegExp(req.body.searchField, "i"); // i = case insensitive
            if (mongoose.Types.ObjectId.isValid(req.body.searchFilters.customer)) andFilters.push({'customer': req.body.searchFilters.customer});

            andFilters.push({isActive: true});
            andFilters.push({ name: { $regex: re }});

            var pagOptions = {
                page: req.body.page || 1,
                limit: req.body.searchLimit || 10,
                lean: true
            };

            achievementModel.paginate({$and: andFilters}, pagOptions)
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) })
        }

    }

}).call(this);

