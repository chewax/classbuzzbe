(function () {
    'use strict';

    var errorHandler = require('../errors/errorHandler');
    var questGoalModel = require('./questGoalModel');

    module.exports.create = function(req,res){
        var newGoal = new questGoalModel(req.body);
        newGoal.save()
            .then (function (result) { res.status(200).json(result); })
            .catch(function (err) {errorHandler.handleError(err, req, res)});
    };


    module.exports.update = function(req,res){

        var element_id = req.params.id;
        delete req.body._id;
        var data = req.body;

        questGoalModel.findOneAndUpdate({_id: element_id}, data)
            .then (function (result) { res.status(200).json(result); })
            .catch(function (err) {errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function(req,res){
        questGoalModel.findOneAndRemove({_id:req.body._id})
            .then (function (result) { res.status(200).json(result); })
            .catch(function (err) {errorHandler.handleError(err, req, res)});
    };

    module.exports.find = {
        all: function(req, res) {
            questGoalModel.find()
                .populate("skill activity customer")
                .then (function (result) { res.status(200).json(result); })
                .catch(function (err) {errorHandler.handleError(err, req, res)});
        },

        one: function(req, res) {
            questGoalModel.findOne({_id:req.params.id})
                .populate("skill activity customer")
                .then (function (result) { res.status(200).json(result); })
                .catch(function (err) {errorHandler.handleError(err, req, res)});
        },

        paginate: function(req, res) {

            var andFilters = [];

            if (typeof req.body.searchField != "undefined") {
                var re = new RegExp(req.body.searchField, "i"); // i = case insensitive
                andFilters.push({ name: { $regex: re }});
            }

            var pagOptions = {
                page: req.body.page || 1,
                limit: req.body.searchLimit || 10,
                lean: true,
                populate: "skill activity customer"
            };

            questGoalModel.paginate({$and: andFilters}, pagOptions)
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) })
        }
    };

}).call(this);