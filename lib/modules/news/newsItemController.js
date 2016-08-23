(function(){
    'use strict';

    var newsItemModel = require('./newsItemModel');
    var userModel = require('../users/userModel');
    var errorHandler = require('../errors/errorHandler');
    var config = require('../../config');



    module.exports.create = function (req, res) {
        var newsItem = new newsItemModel(req.body);
        newsItem.save()
            .then( function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };


    module.exports.remove = function (req, res) {
        newsItemModel.findByIdAndRemove(req.body._id)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };



    module.exports.update = function (req, res) {
        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;
        newsItemModel.findByIdAndUpdate(element_id, data)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };


    module.exports.find = function(req, res){
        if (typeof req.body.params.id != "undefined")
        {
            newsItemModel.findOne({_id:req.body.params.id})
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
        else
        {
            newsItemModel.find()
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
    };


    module.exports.getUserNews = function(req, res) {

        if (typeof req.body.limit == 'undefined') req.body.limit = 10;
        if (typeof req.body.fromIndex == 'undefined') req.body.fromIndex = 0;

        var limit = req.body.limit;
        var fromIndex = req.body.fromIndex;

        var andFilters = [];
        var aggregatePipeline = [];

        userModel.findOne({_id: req.body.userId})
            .then(function(user){

                if (!user) {
                    res.status(400).send("user not found");
                    return;
                }

                andFilters.push({customer: user.customer});
                andFilters.push({group: {$in: user.groups} });

                aggregatePipeline.push({ $sort:  {createdAt: -1}});
                aggregatePipeline.push({ $match: {$and:andFilters}} );
                aggregatePipeline.push({ $skip:  fromIndex});
                aggregatePipeline.push({ $limit: limit});

                newsItemModel.aggregate( aggregatePipeline, function(err, result){

                    if (err) {
                        errorHandler.handleError(err, req, res);
                        return;
                    }

                    newsItemModel.populate(result, {path:'group author'}, function(err, result){
                        if (err) errorHandler.handleError(err, req, res);
                        else res.status(200).json(result);
                    });

                })

            })
            .catch(function (err) { errorHandler.handleError(err, req, res)});

    }
    
}).call(this);
