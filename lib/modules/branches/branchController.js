(function () {
    'use strict';

    var config = require('../../config');

    var messages = require('../core/systemMessages');
    var errorHandler = require('../errors/errorHandler');

    var branchModel = require('./branchModel');
    var eventModel = require('../events/eventModel');
    var utils = require('../core/utils');

    module.exports.create = function (req, res) {
        var branch = new branchModel(req.body);
        branch.save()
            .then (function (result) { utils.handleSuccess(messages.success.onCreate("Branch"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function (req, res) {
        branchModel.findOneAndRemove({_id: req.body.id})
            .then (function (result) { utils.handleSuccess(messages.success.onDelete("Branch"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.update = function (req, res) {
        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;

        branchModel.findOneAndUpdate({_id:element_id}, data)
            .then (function (result) { utils.handleSuccess(messages.success.onAction("Branch update"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.find = {
        all: function(req,res){
            branchModel.find()
                .select('-__v')
                .populate('headmaster', 'firstName lastName doc')
                .populate('contacts', 'firstName lastName address')
                .populate('groups', 'name level')
                .then( function (results){res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },
        publicAll: function(req,res){
            branchModel.find()
                .select('name')
                .then( function (results){res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },
        some: function(req,res){
            var _branches;

            if (typeof req.body.branches == 'string') _branches = JSON.parse(req.body.branches);
            else _branches = req.body.branches;

            branchModel.find()
                .where('_id').in(_branches)
                .select('name')
                .then( function (results){ res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});},

        one: function(req,res){
            branchModel.findOne({_id: req.params.id})
                .select('-__v')
                .populate('headmaster', 'firstName lastName doc')
                .populate('contacts', 'firstName lastName address')
                .populate('groups', 'name level')
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        },

        byRegisterCode: function(req,res){
            branchModel.findOne({registerCode: req.params.code})
                .select('customer')
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        }
    }

    module.exports.events = {
        all: function(req,res){
            eventModel.find({branch: req.params.id})
                .select('-__v')
                .populate('house', 'name logo score')
                .then( function (results){res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },
        query: function(req,res){
            req.body.branch = req.params.id;
            eventModel.find(req.body)
                .select('-__v')
                .populate('house', 'name logo score')
                .then( function (results){res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
    }



}).call(this);