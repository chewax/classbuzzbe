(function(){

    'use strict';
    var achievementModel = require('./achievementModel');
    var userModel = require('../users/userModel');
    var statPropModel = require ('../statProps/statPropModel');
    var userStatPropModel = require ('../statProps/userStatPropModel');
    var mongoose = require('../../database').Mongoose;
    var _ = require('lodash');
    var eh = require('../core/eventsHandler');
    var errorHandler = require('../errors/errorHandler');


    module.exports.create = function (req, res) {
        var achievement = new achievementModel(req.body);
        achievement.save()
            .then( function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function (req, res) {
        achievementModel.findByIdAndRemove(req.body._id)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.update = function (req, res) {
        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;
        achievementModel.findByIdAndUpdate(element_id, data)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.find = function(req, res){
        if (typeof req.params.id != "undefined")
        {
            achievementModel.findOne({_id: req.params.id})
                .populate('statProps.prop', 'name')
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
        else
        {
            achievementModel.find()
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
    };

    module.exports.findByCustomer = function(req, res){
        achievementModel.find({customer:req.params.id})
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.checkForAchievements = function(user, statProps){

        // Get achievements for these statProps
        var userAchievements = user.student.achievements.map( function(ach){
            return mongoose.Types.ObjectId(ach.achievement.toString());
        });

        achievementModel.find(  {_id: {$nin:userAchievements}} )
            .then(function(achievements){

                // Get user statProps
                userStatPropModel.find({user: user._id})
                    .then(function(userStatProps) {

                        var achievementsToGrant = [];

                        // Check for specific achievement
                        achievements.forEach(function (ach) {
                            if(shouldGrantAchievement(ach, userStatProps)) {
                                achievementsToGrant.push(ach);
                            }
                        });

                        return grantAchievements(user, achievementsToGrant);
                    })
            })
            .catch(function(err) { console.log(err);errorHandler.handleError(err); });

    };

    function shouldGrantAchievement(achToCheck, statProps) {

        var grantAchievement = true;

        achToCheck.statProps.forEach(function(achStatProp){
            // Filter current value of user statProp
            var userSPValue = _.find(statProps, function(sp) {return sp.statProp.toString() == achStatProp.prop.toString()});
            // Check condition
            grantAchievement = grantAchievement && checkAchievementActivationCondition(achStatProp, userSPValue);
        });

        return grantAchievement;
    }

    function grantAchievements(user, achievementsToGrant) {

        if(achievementsToGrant.length > 0) {

            var achievementsIds = achievementsToGrant.map(function(ach){
                return {achievement: ach._id};
            });

            return userModel.update(
                {_id: user._id},
                {$push: {'student.achievements': {$each: achievementsIds}}}
            )
            .then(function(result){
                // Emit events
                achievementsToGrant.forEach(function(ach){
                    eh.emit('achievementunlocked', user, ach);
                });
            })
            .catch(function(err) { console.log(err);errorHandler.handleError(err); });
        }
    }

    function checkAchievementActivationCondition(achStatProp, userSPValue) {

        if(typeof achStatProp == 'undefined' || typeof userSPValue == 'undefined') return false;

        switch(achStatProp.activationCondition) {
            case 'ACTIVE_IF_GREATER_THAN':
                return (userSPValue.value > achStatProp.activationValue);
                break;

            case 'ACTIVE_IF_LOWER_THAN':
                return (userSPValue.value < achStatProp.activationValue);
                break;

            case 'ACTIVE_IF_EQUAL_TO':
                return (userSPValue.value == achStatProp.activationValue);
                break;
        }
    }

    module.exports.paginate = function(req,res){

        var andFilters = [];

        var re = new RegExp(req.body.searchField, "i"); // i = case insensitive
        if (mongoose.Types.ObjectId.isValid(req.body.searchFilters.customer)) andFilters.push({'customer': req.body.searchFilters.customer});

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
}).call(this);
