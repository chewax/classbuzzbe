(function () {

    'use strict';

    var traitModel = require('./traitModel');
    var _ = require("lodash");
    var config = require('../../config');
    var utils = require('../core/utils');
    var errorHandler = require('../errors/errorHandler');
    var messages = require('../core/systemMessages');

    module.exports.ennumerate = {
        placements: function (req, res) {
            var placements = ['eyes', 'head', 'chest', 'legs', 'feet', 'leftHand', 'rightHand', 'mouth', 'facialHair', 'hair', 'eyebrow', 'upperBody', 'lowerBody', 'companionRight', 'companionLeft'];
            res.status(200).json(placements);
        },

        traitTypes: function (req, res) {
            var types = ['body', 'wearable', 'background', 'companion', 'colour'];
            res.status(200).json(types);
        }
    };

    module.exports.create = function(req, res){
        var newTrait = new traitModel(req.body);
        newTrait.save()
            .then( function(result) {res.status(200).json(result)})
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    }

    module.exports.remove = function(req, res){
        traitModel.findOneAndRemove({_id: req.body._id})
            .then (function (result) { utils.handleSuccess( messages.success.onDelete('Trait'), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    }

    module.exports.softDelete = function(req, res) {
        traitModel.findOne( {_id: req.body._id})
            .then(function(trait) {
                trait.enabled = false;
                trait.visible = false;
                return trait.save()
            })
            .then (function (result) { utils.handleSuccess( messages.success.onUpdate('Trait'), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    }

    module.exports.update = function(req, res) {

        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;

        traitModel.findOneAndUpdate({_id:element_id}, data)
            .then (function (result) { utils.handleSuccess( messages.success.onUpdate('Trait'), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    }

    module.exports.find = {
        all: function(req, res) {
            traitModel.find()
                .then( function(result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        one: function(req, res) {
            traitModel.findOne({_id:req.params.id})
                .then( function(result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        query: function(req, res) {
            traitModel.findOne(req.body)
                .then( function(result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        paginate: function (req, res) {

            var re = new RegExp(req.body.searchField, "i"); // i = case insensitive
            var orFilters = [{ name: { $regex: re }}]; // Compile OR filters
            var andFilters = [];


            // Compile AND filters
            if (req.body.searchFilters.traitType) andFilters.push({'traitType': req.body.searchFilters.traitType});
            if (req.body.searchFilters.placement) andFilters.push({'placement': req.body.searchFilters.placement});


            var pagOptions = {
                page: req.body.page || 1,
                limit: req.body.limit || 10,
                sortBy: {'name': 1},
                populate: 'requirements.trait',
                lean: true
            };

            if (andFilters.length > 0) {

                andFilters.push({$or:orFilters});
                traitModel.paginate({$and: andFilters }, pagOptions)
                    .then( function (results){ res.status(200).json(results); })
                    .catch(function (err) { errorHandler.handleError(err, req, res); });
            }

            else {

                traitModel.paginate({$or: orFilters }, pagOptions)
                    .then( function (results){ res.status(200).json(results); })
                    .catch(function (err) { errorHandler.handleError(err, req, res); });
            }
        }
    }


}).call(this);

