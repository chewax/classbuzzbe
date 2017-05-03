(function(){
    'use strict';

    var mailer = require('./statusMailController');
    var logger = require('../log/logger').getLogger();
    var moment = require('moment');
    var errorHandler = require('../errors/errorHandler');

    /**
     * Recieves and handles webhook for delivered mails.
     * Checks on the DB if that mail is a weekly parent information mail and then updates the status accordingly
     * Always returns a status 200 so that mailgun stops retrying.
     * @param req
     * @param res
     */
    module.exports.delivered = function(req, res){
        var data = parseMailgunData(req.body);
        mailer.setMailRecordStatus(data.messageId, 'delivered', data.timestamp)
            .then(function(record){
                logger.info("Status mail was delivered: " + record.messageId);
            })
            .catch(function(err){
                errorHandler.handleError(err);
            })
            
        res.status(200).send("Delivered webhook recieved");
    }

    /**
     * Recieves and handles webhook for opened mails.
     * Checks on the DB if that mail is a weekly parent information mail and then updates the status accordingly
     * Always returns a status 200 so that mailgun stops retrying.
     * @param req
     * @param res
     */
    module.exports.opened = function(req, res){

        var data = parseMailgunData(req.body);

        mailer.setMailRecordStatus(data.messageId, 'opened', data.timestamp)
            .then(function(record){
                logger.info("Status mail was opened: " + record.messageId);
            })
            .catch(function(err){
                errorHandler.handleError(err);
            })

        res.status(200).send("Opened webhook recieved");
    }

    /**
     * Recieves and handles webhook for dropped mails.
     * Checks on the DB if that mail is a weekly parent information mail and then updates the status accordingly
     * Always returns a status 200 so that mailgun stops retrying.
     * @param req
     * @param res
     */
    module.exports.dropped = function(req, res){

        var data = parseMailgunData(req.body);
        console.log(data);
        mailer.setMailRecordStatus(data.messageId, 'dropped', data.timestamp)
            .then(function(record){
                logger.info("Status mail was dropped: " + record.messageId);
            })
            .catch(function(err){
                errorHandler.handleError(err);
            })
        res.status(200).send("Dropped webhook recieved");
    }


    /**
     * Recieves and handles webhook for bounced mails.
     * Checks on the DB if that mail is a weekly parent information mail and then updates the status accordingly
     * Always returns a status 200 so that mailgun stops retrying.
     * @param req
     * @param res
     */
    module.exports.bounced = function(req, res){
        
        var data = parseMailgunData(req.body);
        console.log(data);
        mailer.setMailRecordStatus(data.messageId, 'bounced', data.timestamp)
            .then(function(record){
                logger.info("Status mail was bounced: " + record.messageId);
            })
            .catch(function(err){
                errorHandler.handleError(err);
            })
        res.status(200).send("Bounced webhook recieved");
    }

    /**
     * Parses mailgun request body data to a clean json.
     * @param data
     * @returns {{recepient: *, event: *, timestamp: *, messageId: *}}
     */
    function parseMailgunData(data){

        var parsedData = {
            recepient: data["recepient"],
            event: data["event"],
            timestamp: moment.unix(data.timestamp),
            messageId: data["Message-Id"] || data["message-id"]
        };

        if (typeof  parsedData.messageId == 'undefined')
            return parsedData;

        if (parsedData.messageId[0] == "<") {
            return parsedData;
        }
        else {
            parsedData.messageId = "<" + parsedData.messageId + ">";
            return parsedData;
        }
    }

}).call(this);
