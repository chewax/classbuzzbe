(function () {
    'use strict';

    var errorHandler = require('../errors/errorHandler');
    var questGoalModel = require('./questGoalModel');

    module.exports.create = function(req,res){
        var newGoal = new questGoalModel(req.body);
        newGoal.save()
            .then (function (result) { res.status(200).json(result); })
            .catch(function (err) {errorHandler.handleError(err, req, res)});
    };

}).call(this);