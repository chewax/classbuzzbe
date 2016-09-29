(function(){

    'use strict';
    var achievementModel = require('./achievementModel');
    var errorHandler = require('../errors/errorHandler');


    module.exports.create = function (req, res) {
        var achievement = new achievementModel(req.body);
        achievement.save()
            .then( function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function (req, res) {
        achievementModel.findByIdAndRemove(req.body._id)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.update = function (req, res) {
        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;
        achievementModel.findByIdAndUpdate(element_id, data)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.find = function(req, res){
        if (typeof req.body.params.id != "undefined")
        {
            achievementModel.findOne({_id:req.body.params.id})
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
        else
        {
            achievementModel.find()
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
    }

    module.exports.findByCustomer = function(req, res){
        achievementModel.find({customer:req.params.id})
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    }


    module.exports.paginate = function(req,res){

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

        achievementModel.paginate({$and: andFilters}, pagOptions)
            .then(function (results){ res.status(200).json(results) ;})
            .catch(function (err) { errorHandler.handleError(err, req, res) })
    }


}).call(this);
