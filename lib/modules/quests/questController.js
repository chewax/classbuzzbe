(function () {
    'use strict';

    var errorHandler = require('../errors/errorHandler');
    var eh = require('../core/eventsHandler');
    var userModel = require('../users/userModel');
    var questModel = require('./questModel');
    var mongoose = require('../../database').Mongoose;
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
        },

        paginate: function(req, res) {

            var andFilters = [];

            if (typeof req.body.searchField != "undefined") {
                var re = new RegExp(req.body.searchField, "i"); // i = case insensitive
                andFilters.push({ name: { $regex: re }});
            }

            if (mongoose.Types.ObjectId.isValid(req.body.searchFilters.customer)) andFilters.push({'customer': req.body.searchFilters.customer});

            var pagOptions = {
                page: req.body.page || 1,
                limit: req.body.searchLimit || 10,
                lean: true,
                populate: "goals"
            };

            questModel.paginate({$and: andFilters}, pagOptions)
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) })
        }
    };



}).call(this);
