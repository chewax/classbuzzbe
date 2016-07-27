(function () {
    'use strict';

    var utils = require('../core/utils');
    var appKeyModel = require("./appKeyModel");
    var errorHandler = require('../errors/errorHandler');

    module.exports.create = function(req,res){
        var newAppKey = new appKeyModel();
        newAppKey.name = req.body.name;
        newAppKey.save()
            .then( function (result) { res.status(200).json(result) })
            .catch( function (err) { errorHandler.handleError(err, req, res) });
    };

}).call(this);