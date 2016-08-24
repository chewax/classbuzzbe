(function () {
    'use strict';

    var messages = require('./../core/systemMessages');
    var mongoose = require('../../database').Mongoose;
    var logger = require('../log/logger').getLogger();
    var customErr = require('./customErrors');
    var mailer = require('../mailing/mailingController');
    var errorModel = require('./errorModel');
    var _ = require('underscore');

    module.exports.handleUncaughtErrors = function(err, req, res, next) {

        console.log(err);


        var requestInfo = {
            ip: req.connection.remoteAddress
        }

        if (err.name === 'UnauthorizedError') {
            logger.warn('Access attempt with invalid token: ' + JSON.stringify(requestInfo) );
            res.status(401).send(messages.data.missingOrIncomplete("Token"));
            return;
        }

        if (err.name === 'SyntaxError') {
            logger.info('Bad request, syntax error: ' + JSON.stringify(requestInfo) );
            res.status(401).send(messages.request.badRequest(err.message));
            return;
        }

        //OTHERWISE
        logger.error('Unhandled Error: ' + err );
        res.status(500).send(messages.generic());

    };


    /**
     * Handle promises errors if res not null returns the response to the client
     * @param err Error - Thrown error
     * @param [req Request] - Sent Request
     * @param [res Response] - Response object
     *
     * Error Param Structure. Must be a Standard Javascript Error plus.
     *
         * err.statusCode = Number
         * err.userMessage = String //reason
         * err.message = String //Inherited from Error
         * err.user = String //_id of logged user when error happened
         * err.origin = String //App that originated the error
         * err.stack = String //Inherited from Error
     *
     */
    module.exports.handleError = function(err, req, res) {

        if (typeof req == 'undefined') req = null;
        if (typeof res == 'undefined') res = null;


        if (typeof err.user == 'undefined') {
            if (typeof req.user == "undefined") err.user = null;
            else err.user = req.user.id;
        }

        var resObj = {
            status: getErrorCode(err),
            message: err.userMessage || messages.generic(),
            reason: err.message || err
        };

        createErrorRecord(err)
            .then(function(errRecord){
                sendErrorMail(errRecord, function(error, body){})
            });

        logger.error(JSON.stringify(resObj));

        if (res != null) res.status(resObj.status).json(resObj);
    };


    /**
     * Creates new Error Record on MongoDB
     * @param err
     * @returns {*}
     */
    function createErrorRecord(err) {
        var newError = new errorModel();

        newError.user = err.user;
        newError.status = getErrorCode(err);
        newError.message = err.userMessage || messages.generic();
        newError.reason = err.message || err;
        newError.stack = err.stack;
        newError.origin = err.origin || 'API Backend';
        newError.err = err;

        return newError.save();
    }


    function sendErrorMail(err, cb) {

        //Only send mail if errorCode == 500
        if (getErrorCode(err) != 500) {
            return;
        }

        messages.log.formatHtml(err)
            .then(function(renderedHTML){
                var data = {
                    from: "errors@classbuzz.edu.uy",
                    to: "support@classbuzz.edu.uy",
                    subject: '[ClassBuzz] - ERROR LOG',
                    html: renderedHTML
                };
                mailer.sendMail(data, cb);
            });
    }

    function getErrorCode(err){

        var reRes = RegExp("E11000").exec(err);
        if (!_.isEmpty(reRes)) return 409;

        if (err.statusCode) return err.statusCode;
        if (err.status) return err.status;

        return 500;
    }


}).call(this);
