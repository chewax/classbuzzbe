(function(){

    'use strict';
    var rankModel = require('./rankModel');
    var errorHandler = require('../errors/errorHandler');


    module.exports.create = function (req, res) {
        var rank = new rankModel(req.body);
        rank.save()
            .then( function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function (req, res) {
        rankModel.findByIdAndRemove(req.body._id)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.update = function (req, res) {
        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;
        rankModel.findByIdAndUpdate(element_id, data)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.find = function(req, res){
        if (typeof req.body.params.id != "undefined")
        {
            rankModel.findOne({_id:req.body.params.id})
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
        else
        {
            rankModel.find()
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
    };



    /**
     * Bake Ranks for a Customer.
     * Intended to be called upon creating a new customer.
     *
     * @param customerid
     * @param [ranks] If no ranks are passed, then default rankset is applied
     *
     */
    module.exports.bake = function(customerid, ranks) {

        if (typeof ranks == "undefined" || ranks == null || ranks == []) {

            ranks = [
                {name: "Apprentice", ordinality:"1"},
                {name: "Journeyman", ordinality:"2"},
                {name: "Expert", ordinality:"3"},
                {name: "Artisan", ordinality:"4"},
                {name: "Master", ordinality:"5"},
                {name: "Grand Master", ordinality:"6"},
                {name: "Illustrious Grand Master", ordinality:"7"},
                {name: "Zen Master", ordinality:"8"} ]
        }

        rankModel.count({customer:customerid})
            .then(function(result){
                if (result == 0) rankModel.bake(ranks, customerid);
            });
    }

    //TODO Remove this
    module.exports.bake("5706b65bdf0560b027cd0a0f");

}).call(this);

