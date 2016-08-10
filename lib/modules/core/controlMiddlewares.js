(function () {
    'use strict';

    var messages = require('systemMessages');
    var utils = require('./utils');
    var config = require('../../config');
    var logger = require('../log/logger').getLogger();
    var appKeyModel = require("./appKeyModel");
    var _ = require("lodash");

    /**
     * Checks that there is data in the request body
     * @returns {Function} the middleware to check if there is a body.
     */
    module.exports.hasPayload = function() {
        return function(req, res, next) {

            if (utils.isEmpty(req.body)) {
                res.status(400).send(messages.data.missing("Payload"));
                return;

            } else {
                next();
            }
        };
    };

    module.exports.checkAppKey = function(req, res, next) {

            var headers = req.headers;
            var appKey = headers.appkey;

            appKeyModel.findOne({key: appKey})
                .then( function(result) {
                    if (!_.isNull(result)) next();

                    else {
                        logger.warn("Access attempt with wrong app key: " + appKey);
                        res.status(401).send(messages.auth.wrongAppKey());
                        return;
                    }
                })
                .catch( function (err) {
                    next(err);
                });
    };

}).call(this);