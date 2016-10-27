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
            .then( function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function (req, res) {
        activityModel.findOneAndRemove({_id: req.body._id})
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.update = function (req, res) {
        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;

        activityModel.findOneAndUpdate({_id: element_id}, data)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.find = {

        /**
         * Parses querystring and calls corresponding method
         * @param req
         * @param res
         */
        all: function(req,res){

            if (req.query == {} || req.query == null ||  typeof req.query == "undefined") {

                activityModel.find()
                    .and({isActive: true})
                    .populate('skills rank')
                    .then( function (results){ res.status(200).json(results); } )
                    .catch(function (err) { errorHandler.handleError(err, req, res)});
            }

            else if (typeof  req.query.paginate != "undefined") {
                paginate(req, res)
            }

            else if (typeof req.query.q != "undefined") {
                autocomplete(req, res)
            }

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


        paginate: function(req, res) {

            var andFilters = [];

            if (typeof req.body.name != "undefined") {
                var re = new RegExp(req.body.name, "i"); // i = case insensitive
                andFilters.push({ name: { $regex: re }});
            }

            if (mongoose.Types.ObjectId.isValid(req.body.customer)) andFilters.push({'customer': req.body.customer});

            var pagOptions = {
                page: req.query.page || 1,
                limit: req.query.limit || 10,
                lean: true,
                populate: "skills rank"
            };

            activityModel.paginate({$and: andFilters}, pagOptions)
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) })
        }

    };



    /**
     * Returns first 5 activites that match regex.
     * Used for showing options on ajax autocomplete fields
     * Receives querystring parameters
     * @param req
     * @param res
     */
    function autocomplete (req, res){

        var re = new RegExp(req.query.q, "i"); // i = case insensitive
        var limit = req.query.limit || 5;
        var customer = req.query.customer || "";

        if (limit<=0) {

            activityModel.find({ name: { $regex: re }})
                .and({customer: customer})
                .populate('skill rank')
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) })
        }

        else {

            // If limit is more than zero. I assume the user wants the same amount of negative activities as possitive.
            // So the limit is used to filter both positive and negative. Thus the amount of activities that will be
            // returned will be 2 times the limit sent.

            var _resObj = [];
            var _promises = [];

            //Positive Activities
            var pos = activityModel.find({ name: { $regex: re }})
                .and({customer: customer})
                .and({"reward.xp": { $gt: 0}})
                .limit(limit)
                .populate('skills rank')
                .then(function (results){ _resObj = _.concat(_resObj, results); });

            //Negative Activities
            var neg = activityModel.find({ name: { $regex: re }})
                .and({customer: customer})
                .and({"reward.xp": { $lt: 0}})
                .limit(limit)
                .populate('skills rank')
                .then(function (results){ _resObj = _.concat(_resObj, results); });


            _promises.push(pos);
            _promises.push(neg);

            Promise.all(_promises)
                .then(function (results){ res.status(200).json(_resObj) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) })
        }
    }

    /**
     * Paginates activites.
     * Receives querystring parameters.
     * @param req
     * @param res
     */
    function paginate (req,res){

        var andFilters = [];

        var re = new RegExp(req.query.q, "i"); // i = case insensitive
        if (mongoose.Types.ObjectId.isValid(req.query.customer)) andFilters.push({'customer': req.query.customer});

        andFilters.push({ name: { $regex: re }});

        var pagOptions = {
            page: req.query.page || 1,
            limit: req.query.limit || 10,
            lean: true,
            populate: "skills rank"
        };

        activityModel.paginate({$and: andFilters}, pagOptions)
            .then(function (results){ res.status(200).json(results) ;})
            .catch(function (err) { errorHandler.handleError(err, req, res) })
    }

}).call(this);

