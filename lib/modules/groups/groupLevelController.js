(function () {
    'use strict';

    var groupLevelModel = require('./groupLevelModel');
    var errorHandler = require('../errors/errorHandler');

    module.exports.find = {
        all: function(req, res){
            groupLevelModel.find({customer:req.params.customer})
                .then(function(levels){
                    res.status(200).send(levels);
                })
                .catch(function(err){
                    errorHandler.handleError(err, req, res);
                })
        }
    }


}).call(this);