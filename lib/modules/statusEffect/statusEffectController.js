(function(){

    'use strict';
    var statusEffectModel = require('./statusEffectModel');
    var errorHandler = require('../errors/errorHandler');


    module.exports.create = function (req, res) {
        var statusEffect = new statusEffectModel(req.body);
        statusEffect.save()
            .then( function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function (req, res) {
        statusEffectModel.findByIdAndRemove(req.body._id)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.update = function (req, res) {
        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;
        statusEffectModel.findByIdAndUpdate(element_id, data)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.find = function(req, res){
        if (typeof req.body.params.id != "undefined")
        {
            statusEffectModel.findOne({_id:req.body.params.id})
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
        else
        {
            statusEffectModel.find()
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
    };


    module.exports.bake = function(req,res) {
        console.log("baking status effects".cyan);

        var modifiers = ["goldGained", "xpGained", "xpLost", "houseContribution", "questSlots"];

        modifiers.forEach(function(m){
            var se = new statusEffectModel();

            se.name = m + " buff";
            se.type = "buff";
            se.modifies = m;
            se.amount = 20;
            se.duration = 24;
            se.detail = "No Detail";

            se.save();

            se = new statusEffectModel();

            se.name = m + " debuff";
            se.type = "debuff";
            se.modifies = m;
            se.amount = 20;
            se.duration = 24;
            se.detail = "No Detail";

           se.save();

        })


    };

    //module.exports.bake();


}).call(this);

