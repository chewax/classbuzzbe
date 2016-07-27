(function(){
    'use strict'

    var mailplate = require('mailplate.js');
    var mailingUtils = require('./mailingUtils');
    var errorHandler = require('../errors/errorHandler');
    var userModel = require('../users/userModel');

    module.exports.newAdHocProcess = newAdHocProcess;

    module.exports.api = {
        newAdHocProcess: function(req, res) {

            newAdHocProcess( req.body.customer,  req.body.branch,  req.body.teacher,  req.body.group,  req.body.subject,  req.body.body)
                .then(function(result){ res.status(200).send("OK");
                })
                .catch(function(err){
                    errorHandler.handleError(err, req, res);
                })
        }
    }

    function renderAdHocEmail(_customerLogo, _subject, _body) {
        return new Promise(function(resolve, reject){
            var templateData = {
                customer_logo: _customerLogo,
                mail_subject: _subject,
                mail_body: _body
            };

            mailplate.renderAsync('/lib/templates/inlined/parentNewsletterAdHoc.html', templateData)
                .then(function(resHTML){
                    resolve(resHTML);
                })
                .catch(function(err){
                    reject(err);
                })
        });
    }

    function newAdHocProcess (_customer, _branch, _teacher, _group, _subject, _body) {

        return mailingUtils.triggerNewMailProcess(_customer, _branch, _teacher, _group,  "AdHoc Mailing Process", function(_st, procId) {

            return userModel.populate(_st, {path:'customer'})
                .then(function(popSt){
                    return renderAdHocEmail (popSt.customer.logoURL, _subject, _body)
                })
                .then(function(_fullHTML) {
                    var resObj = {
                        finalHTML: _fullHTML,
                        subject: _subject
                    }

                    return resObj;
                })
                .catch(function(err) { errorHandler.handleError(err); })
        })
    }

}).call(this);
