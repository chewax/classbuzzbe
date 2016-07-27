(function(){
    'use strict'

    var config = require('../../config');
    var mailgun = require('mailgun-js')({
        apiKey: config.mailgun.apiKey,
        domain: config.mailgun.domain
    });

    /**
     * Mailgun Validation Middleware for Webhooks
     * @param req
     * @param res
     * @param next
     */
    module.exports.mailgunValidationMiddleware = function (req, res, next) {
        var body = req.body;

        if (!mailgun.validateWebhook(body.timestamp, body.token, body.signature)) {
            console.error('Request came, but not from Mailgun');
            res.send({ error: { message: 'Invalid signature. Are you even Mailgun?' } });
            return;
        }

        next();
    }


}).call(this);
