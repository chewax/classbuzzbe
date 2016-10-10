(function () {

    'use strict';

    var traitModel = require('./defaultTraitModel');
    var _ = require("lodash");
    var config = require('../../config');
    var utils = require('../core/utils');
    var messages = require('../core/systemMessages');
    var errorHandler = require('../errors/errorHandler');


    module.exports.create = function(req, res){
        var newTrait = new traitModel(req.body);
        newTrait.save()
            .then( function(result) {res.status(200).json(result)})
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    }

    module.exports.remove = function(req, res){
        traitModel.findOneAndRemove({_id: req.body._id})
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    }

    module.exports.update = function(req, res) {

        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;

        traitModel.findOneAndUpdate({_id:element_id}, data)
            .then (function (result) { res.status(200).json(result) })
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
                .populate('body.head body.upperBody body.lowerBody body.eyes body.eyebrows body.mouth body.hair body.faceHair wearables.head wearables.chest wearables.legs wearables.eyes wearables.feet wearables.leftHand wearables.rightHand')
                .then( function(result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        gender: function(req, res) {
            traitModel.findOne({gender:req.params.gender})
                .populate('body.head body.upperBody body.lowerBody body.eyes body.eyebrows body.mouth body.hair body.faceHair wearables.head wearables.chest wearables.legs wearables.eyes wearables.feet wearables.leftHand wearables.rightHand')
                .then( function(result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
    }


}).call(this);


