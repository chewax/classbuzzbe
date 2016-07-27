(function () {
    'use strict';

    var config = require('../../config');
    var messages = require('../core/systemMessages');
    var houseModel = require('./houseModel');
    var userModel = require('../users/userModel');
    var utils = require('../core/utils');
    var errorHandler = require('../errors/errorHandler');
    var eventEmitter = require('../core/eventsHandler');
    var _ = require("underscore");
    var mongoose = require('../../database').Mongoose;

    module.exports.getHouseRanking = getHouseRanking;
    module.exports.getXPAward = getXPAward;

    module.exports.create = function (req, res) {
        var house = new houseModel(req.body);
        house.save()
            .then (function (result) { utils.handleSuccess(messages.success.onCreate("House"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function (req, res) {
        houseModel.findOneAndRemove({_id: req.body._id})
            .then (function (result) { utils.handleSuccess(messages.success.onDelete("House"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };


    module.exports.update = function (req, res) {

        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;

        houseModel.findOneAndUpdate({_id: element_id}, data)
            .then (function (result) { utils.handleSuccess(messages.success.onAction("House update"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.find = {
        users: function(req, res) {

            var pagOptions = {
                page: req.body.page || 1,
                limit: req.body.limit || 10,
                columns: '-credentials -activity',
                populate: 'roles groups student.house',
                lean: true
            };

            userModel.paginate({"student.house":req.params.id}, pagOptions)
                .then( function (results){ res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        all: function (req, res) {
            houseModel.find()
                .then( function (results){ res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        one: function (req, res) {
            houseModel.findOne({_id: req.params.id})
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        },

        byCustomer: function (req, res) {
            houseModel.find({customer: req.body.customer})
                .sort("-score")
                .then( function (results){ res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        /**
         * Search group as in searchField field and returns result as pagination as requested
         * {
         *  page: number,
         *  limit: number
         *  searchField: string
         *  seachFilters {
         *   customer: String
         * }
         * @param req
         * @param res
         */
        paginate: function (req, res) {

            var reTerm = req.body.searchField;
            var terms = reTerm.split(" ");

            if (terms.length > 1) {
                reTerm = terms[0];
                for (var i = 1; i < terms.length; i++ ) {
                    reTerm = reTerm + "|" + terms[i]  ;
                }
            }

            //var re = new RegExp(req.body.searchField, "i"); // i = case insensitive
            var re = new RegExp(reTerm, "i"); // i = case insensitive
            var orFilters = [{ name: { $regex: re }}]; // Compile OR filters
            var andFilters = [];


            // Compile AND filters
            if (mongoose.Types.ObjectId.isValid(req.body.searchFilters.customer)) andFilters.push({'customer': req.body.searchFilters.customer});


            var pagOptions = {
                page: req.body.page || 1,
                limit: req.body.limit || 10,
                populate: 'head customer',
                lean: true
            };

            if (andFilters.length > 0) {

                andFilters.push({$or:orFilters});

                houseModel.paginate({$and: andFilters }, pagOptions)
                    .then( function (results){ res.status(200).json(results);})
                    .catch(function (err) { errorHandler.handleError(err, req, res); });
            }

            else {

                houseModel.paginate({$or: orFilters }, pagOptions)
                    .then( function (results){ res.status(200).json(results); })
                    .catch(function (err) { errorHandler.handleError(err, req, res); });
            }
        }
    }

    module.exports.events = {
        all: function (req, res) {
            eventModel.find({house: req.params.id})
                .select('-__v -house')
                .populate('branch', 'name')
                .then( function (results){res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        query: function (req, res) {
            req.body.house = req.params.id;
            eventModel.find(req.body)
                .select('-__v -house')
                .populate('branch', 'name')
                .then( function (results){res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },
    }

    function getHouseRanking(customerId, houseId){
        var rank = -1;
        return new Promise(function(resolve, reject){
            houseModel.find({customer: customerId})
                .sort("-score")
                .then(function(houses){

                    for (var i=0; i<houses.length; i++) {
                        if (houses[i]._id.toString() == houseId.toString()) {
                            rank = i + 1;
                            break;
                        }
                    }

                    resolve(rank);
                })
                .catch(function(err){
                    reject(err);
                })
        });

    }

    function getXPAward(customerId, houseId, achievementXpAward) {
        return new Promise(function(resolve, reject){
            getHouseRanking(customerId, houseId)
                .then(function(rank){
                    if (achievementXpAward > 0)
                        resolve(Math.round(achievementXpAward * config.houses.xpPointsRatio * rank));
                    else
                        resolve(Math.round(achievementXpAward * config.houses.xpPointsRatio));
                })
                .catch(function(err){
                    reject(err);
                })
        })
    }


    //Increase House Score on Events!
    eventEmitter.on('xpaward', function(user, xp) {
        var increment = Math.round(xp * config.houses.xpPointsRatio);
        houseModel.update({_id:user.student.house}, {$inc: {score: increment}}, function (result) {});
    });

    eventEmitter.on('xpforfeit', function(user, xp){
        var decrement = -Math.round(xp * config.houses.xpPointsRatio);
        houseModel.update({_id:user.student.house}, {$inc: {score: decrement}}, function (result) {});
    });

    eventEmitter.on('achievementaward', function(user, achievement) {

        getXPAward(user.customer, user.student.house, achievement.xpAward)
            .then(function(xp){
                houseModel.update({_id:user.student.house}, {$inc: {score: xp}}, function (result) {});
        });


    });

}).call(this);