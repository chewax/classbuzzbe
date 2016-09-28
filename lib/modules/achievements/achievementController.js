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
        if (typeof req.body.params.id != "undefined")
        {
            achievementModel.findOne({_id:req.body.params.id})
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

        // Get statProps related with the event
        statPropModel.find({name:{$in: statProps}})
            .then(function (statPropsDB) {

                var statPropsIds = statPropsDB.map(function(sp){
                    return sp._id;
                });

                var _and = [];

                _and.push({_id: {$nin: user.student.achievements.map(function(ach){
                    return ach.achievement;
                })}});

                //_and.push({statProps: {$elemMatch: {prop:{$in: statPropsIds}}}});
                console.log(user.student.achievements.map(function(ach){
                    return ach.achievement;
                }));
                // Get achievements for these statProps
                //achievementModel.find({statProps: {$elemMatch: {prop:{$in: statPropsIds}}}})
                achievementModel.find(_and)
                    .then(function(achievements){

                        // Get user statProps
                        userStatPropModel.find({user: user._id})
                            .then(function(userStatProps) {

                                var achievementsToGrant = [];
                                //var achievementsToCheck = filterSPUserAchievements(achievements, user.student.achievements, user);

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
            })
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


    function filterSPUserAchievements(spAch, usrAch) {
        return _.differenceBy(spAch, usrAch, function(ach){
            if(typeof ach.achievement == 'undefined') {
                return ach._id.toString();
            } else {
                return ach.achievement.toString();
            }
        });
    }

}).call(this);
