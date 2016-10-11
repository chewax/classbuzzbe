(function(){
    'use strict';

    var newsItemModel = require('./newsItemModel');
    var userModel = require('../users/userModel');
    var errorHandler = require('../errors/errorHandler');
    var config = require('../../config');
    var eh = require('../core/eventsHandler');
    var _ = require('lodash');



    module.exports.create = function (req, res) {
        var newsItem = new newsItemModel(req.body);
        newsItem.save()
            .then( function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };


    module.exports.remove = function (req, res) {
        newsItemModel.findByIdAndRemove(req.params.id)
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

    /**
     * Get user news.
     * @param req
     * @param res
     */
    module.exports.getUserNews = function(req, res) {

        if (typeof req.body.limit == 'undefined') req.body.limit = 10;
        if (typeof req.body.fromIndex == 'undefined') req.body.fromIndex = 0;

        var limit = req.body.limit;
        var fromIndex = req.body.fromIndex;

        var andFilters = [];
        var aggregatePipeline = [];
        var _user = {};

        userModel.findOne({_id: req.body.userId})
            .populate('groupsBelonging groupsOwned')
            .then(function(user){

                _user = user;
                var userGroups = _.unionBy(_user.groupsBelonging, _user.groupsOwned, '_id');
                userGroups = userGroups.map(function(g){ return g._id });

                andFilters.push({customer: _user.customer});
                andFilters.push({group: {$in: userGroups} });

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

    };

    /**
     * Add reaction to news.
     * @param req
     * @param res
     */
    module.exports.addReaction = function (req, res) {
        newsItemModel.findOne({_id: req.params.id})
            .then(function(news){

                news.reactions.push({
                    type: req.body.type,
                    author: req.user.id
                });

                return news.save();

            })
            .then(function(news){
                eh.emit('newpostreaction', user, news);
                res.status(200).json(news);
            })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    /**
     * Remove reaction from news
     * @param req
     * @param res
     */
    module.exports.removeReaction = function (req, res) {
        newsItemModel.findOne({_id: req.params.id})
            .then(function(news){

                news.reactions.id(req.params.reactionId).remove();
                return news.save();

            })
            .then(function(news){
                res.status(200).json(news);
            })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };


    /**
     * Adds comment to news.
     * @param req
     * @param res
     */
    module.exports.addComment = function (req, res) {
        newsItemModel.findOne({_id: req.params.id})
            .then(function(news){

                news.comments.push({
                    text: req.body.text,
                    author: req.user.id
                });

                return news.save();
            })
            .then(function(news){
                res.status(200).json(news);
            })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    /**
     * Removes comment from news.
     * @param req
     * @param res
     */
    module.exports.removeComment = function (req, res) {
        newsItemModel.findOne({_id: req.params.id})
            .then(function(news){

                news.comments.id(req.params.commentId).remove();
                return news.save();

            })
            .then(function(news){
                res.status(200).json(news);
            })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };


    
}).call(this);
