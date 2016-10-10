(function () {
    'use strict';

    var config = require('../../config');
    var messages = require('../core/systemMessages');
    var houseModel = require('./houseModel');
    var userModel = require('../users/userModel');
    var utils = require('../core/utils');
    var errorHandler = require('../errors/errorHandler');
    var eh = require('../core/eventsHandler');
    var _ = require("lodash");
    var mongoose = require('../../database').Mongoose;

    module.exports.getHouseRanking = getHouseRanking;
    module.exports.getXPAward = getXPAward;

    module.exports.create = function (req, res) {
        var house = new houseModel(req.body);
        house.save()
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function (req, res) {
        houseModel.findOneAndRemove({_id: req.body._id})
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };


    module.exports.update = function (req, res) {

        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;

        houseModel.findOneAndUpdate({_id: element_id}, data)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.find = {
        users: function(req, res) {

            var pagOptions = {
                page: req.query.page || 1,
                limit: req.query.limit || 10,
                columns: '-credentials -activity',
                populate: 'roles groups student.house',
                lean: true
            };

            userModel.paginate({"student.house":req.params.id}, pagOptions)
                .then( function (results){ res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        all: function (req, res) {
            if (req.query == {} || req.query == null ||  typeof req.query == "undefined")

            houseModel.find()
                .then( function (results){ res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});

            else
                 this.paginate(req, res);
        },

        one: function (req, res) {
            houseModel.findOne({_id: req.params.id})
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        },

        byCustomer: function (req, res) {
            houseModel.find({customer: req.params.id})
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
        }
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

    function getXPAward(user, activityXpAward) {

        return new Promise(function(resolve, reject){

            user.deepPopulate(['student.character.traits.wearables.eyes.attributes.attribute',
                'student.character.traits.wearables.head.attributes.attribute',
                'student.character.traits.wearables.chest.attributes.attribute',
                'student.character.traits.wearables.legs.attributes.attribute',
                'student.character.traits.wearables.leftHand.attributes.attribute',
                'student.character.traits.wearables.rightHand.attributes.attribute',
                'student.character.traits.wearables.feet.attributes.attribute',
                'student.character.traits.wearables.companionRight.attributes.attribute',
                'student.character.traits.wearables.companionLeft.attributes.attribute'], function(err, _user){

                if (err) {
                    console.log(err);
                    reject(err);
                }

                getHouseRanking(_user.customer, _user.student.house)
                    .then(function(rank){

                        var originalXpAward = activityXpAward;

                        _user.student.character.activeStatusEffects.forEach(function(se){

                            if (se.statusEffect.modifies == "houseContribution") {
                                if (se.statusEffect.type == "buff") activityXpAward += (originalXpAward * se.statusEffect.amount / 100);
                                if (se.statusEffect.type == "debuff") activityXpAward -= (originalXpAward * se.statusEffect.amount / 100);
                            };

                        });

                        if (activityXpAward > 0)
                            resolve(Math.round(activityXpAward * config.houses.xpPointsRatio * rank) + _user.student.character.attributeInfo.modifiers.houseContribution);
                        else
                            resolve(Math.round(activityXpAward * config.houses.xpPointsRatio));
                    })
                    .catch(function(err){
                        reject(err);
                    })

            })

        })
    }


    eh.on('activitycompleted', function(user, activity) {

        //activity.houseXp is a temorary custom var to hold the house xp value. That value is calculated upon
        //emiting the event. It is intended that way so that only 1 db query is fired. Otherwise it would be done
        //here and on the eventsController (so far)
        houseModel.update({_id:user.student.house}, {$inc: {score: activity.houseXp}}, function (result) {});
    });

    eh.on('questcompleted', function(user, quest) {

        //quest.houseXp is a temorary custom var to hold the house xp value. That value is calculated upon
        //emiting the event. It is intended that way so that only 1 db query is fired. Otherwise it would be done
        //here and on the eventsController (so far)
        houseModel.update({_id:user.student.house}, {$inc: {score: quest.houseXp}}, function (result) {});

    });

    eh.on('statusmailopened', function(statusMailRecord) {

        if (_.isNil(statusMailRecord.student)) return;

        //Increment xp of the students house whose parent open the status mail.
        userModel.findOne({_id: statusMailRecord.student})
            .then(function(user){
                if (_.isNil(user)) return;
                return houseModel.update({_id:user.student.house}, {$inc: {score: config.houses.xpReceivedFromStatusMailOpened}}, function (result) {});
            });
    });


}).call(this);