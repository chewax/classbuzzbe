(function () {
    'use strict';

    var config = require('../../config');
    var messages = require('../core/systemMessages');
    var activityModel = require('./activityModel');
    var utils = require('../core/utils');
    var errorHandler = require('../errors/errorHandler');
    var mongoose = require('../../database').Mongoose;
    var _ = require('lodash');

    module.exports.create = function (req, res) {

        var activity = new activityModel(req.body);

        //If not provided, then activity customer will match the logged user customer
        if (_.isNull(activity.customer)) {
            activity.customer = req.user.customer;
        };

        activity.save()
            .then( function (result) { utils.handleSuccess(messages.success.onCreate("activity"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function (req, res) {
        activityModel.findOneAndRemove({_id: req.body._id})
            .then (function (result) { utils.handleSuccess(messages.success.onDelete("activity"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.update = function (req, res) {
        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;

        activityModel.findOneAndUpdate({_id: element_id}, data)
            .then (function (result) { utils.handleSuccess(messages.success.onAction("activity update"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.find = {
        all: function(req,res){
            activityModel.find()
                .and({isActive: true})
                .then( function (results){ res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        one: function(req,res){
            activityModel.findOne({_id: req.params.id})
                .and({isActive: true})
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        },

        byCustomer: function(req, res) {
            activityModel.find({customer:req.params.id})
                .and({isActive: true})
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        },

        autocomplete: function(req,res){

            var re = new RegExp(req.body.searchField, "i"); // i = case insensitive
            var limit = req.body.searchLimit || 5;
            var customer = req.body.customer || "";

            if (limit<=0) {

                activityModel.find({ name: { $regex: re }})
                    .and({customer: customer})
                    .and({isActive: true})
                    .then(function (results){ res.status(200).json(results) ;})
                    .catch(function (err) { errorHandler.handleError(err, req, res) })

            }

            else {

                activityModel.find({ name: { $regex: re }})
                    .and({customer: customer})
                    .and({isActive: true})
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

            activityModel.paginate({$and: andFilters}, pagOptions)
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) })
        }

    }

}).call(this);

