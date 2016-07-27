(function(){
    'use strict';

    var traitVersionModel = require('./traitVersionModel');
    var errorHandler = require('../errors/errorHandler');


    module.exports.getVersion = function(req, res){

        traitVersionModel.findOne({customer:req.user.customer})
            .then(function(traitVersion){
                if (traitVersion != null) {
                    //Is created, return value
                    res.status(200).json(traitVersion);
                }
                else {
                    //No record exists (first time)
                    var newtv = new traitVersionModel();
                    newtv.customer = req.user.customer;
                    newtv.save();
                    res.status(200).json(newtv);
                }
            })
            .catch(function (err) { errorHandler.handleError(err, req, res)});

    }


    module.exports.leapVersion = function (req, res) {
        traitVersionModel.findOneAndUpdate({customer:req.user.customer},{ $inc: { version: 1 }})
            .then(function(result){
                res.status(200).json(result);
            })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    }

}).call(this);
