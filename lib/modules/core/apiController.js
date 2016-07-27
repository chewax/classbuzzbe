(function () {
    'use strict';
    var fs = require("fs");
    var config = require("../../config");
    var errorHandler = require('./../errors/errorHandler');

    module.exports.index = function(req,res){
        res.render('login');
    };

    module.exports.renderLiveFeed = function(req,res) {
        res.render('liveFeed');
    }

    module.exports.uploadFile = function (req, res){
        var ufile = req.files[0];

        var currentPath = ufile.path;
        var temp = ufile.mimetype.split("/");
        var extension = temp[1];

        var targetPath = currentPath +"."+extension;

        fs.rename(currentPath, targetPath, function (err) {
            if (err) {
                errorHandler.handleError(err, req, res);
                return;
            }

            var result = { fileURL: config.baseURL + "/uploads/"+ ufile.filename + "." + extension};
            res.status(200).json(result);
        })
    }


}).call(this);