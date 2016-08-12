(function () {
    'use strict';

    var errorHandler = require('../errors/errorHandler');
    var eh = require('../core/eventsHandler');
    var userModel = require('../users/userModel');
    var questModel = require('./questModel');
    var _ = require('underscore');

    module.exports.create = function(req,res){
        var newQuest = new questModel(req.body);
        newQuest.save()
            .then (function (result) { res.status(200).json(result); })
            .catch(function (err) {errorHandler.handleError(err, req, res)});
    };

    module.exports.update = function(req,res){

        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;

        questModel.findOneAndUpdate({_id: element_id}, data)
            .then (function (result) { res.status(200).json(result); })
            .catch(function (err) {errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function(req,res){
        questModel.findOneAndRemove({_id:req.body._id})
            .then (function (result) { res.status(200).json(result); })
            .catch(function (err) {errorHandler.handleError(err, req, res)});
    };

    module.exports.find = {
        all: function(req, res) {
            questModel.find()
                .then (function (result) { res.status(200).json(result); })
                .catch(function (err) {errorHandler.handleError(err, req, res)});
        },

        one: function(req, res) {
            questModel.findOne({_id:req.params.id})
                .then (function (result) { res.status(200).json(result); })
                .catch(function (err) {errorHandler.handleError(err, req, res)});
        }
    }

    function applyQuestReward(user, quest){
        user.student.currency.doubloons += quest.reward;
        return user.save();
    }


    eh.on('activtycompleted', function(user, activity) {
        questModel.find({'trigger.activity': activity._id})
            .then(function(quests){

                if (quests.length <= 0) return; // No quests associated to that activity

                //Else check if user has any of that quest associated to him/her.
                quests.forEach( function (activityQuest) {
                    var index = user.student.quests.indexOf(activityQuest._id);
                    if (index > -1) { //the user has the quest.
                        applyQuestReward(user, activityQuest)
                            .then( function(result) {
                                eh.emit('questcompleted', user, activityQuest);                  //Bradcast "questcompleted" event
                                user.student.quests.splice(index,1);                                //Remove quest from list
                                user.save();
                            })
                    }
                });
            })

            .catch(function (err) { errorHandler.handleError(err, req, res) });
    });

}).call(this);
