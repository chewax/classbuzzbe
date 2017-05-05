(function(){
    'use strict';

    var _ = require('lodash');
    var moment = require('moment');
    var config = require('../../config');
    var eh = require('../core/eventsHandler');
    var mailgun = require('./mailingController').mailgun;
    var Styliner = require('styliner');
    var fs = require('fs');

    module.exports = MailBatch;

    function MailBatch (from, subject, templatePath, threshold) {
        this.data = {};
        this.data["from"] = from;
        this.data["subject"] = subject;
        this.data["html"] = "";
        this.data["recipient-variables"] = {}
        this.data["to"] = [];

        this.templatePath = templatePath;
        this.recipients = [];
        
        if (_.isNil(threshold)) threshold = 999;
        this.threshold = threshold;
    };

    MailBatch.prototype.addRecipient = function(email, vars) {
        this.recipients.push({email: email, vars: vars});
        console.log(this.recipients)
    };
    
    MailBatch.prototype.setParamenter = function(key) {
        this.data["v:"+key] = "%recipient."+key+"%"
    };

    MailBatch.prototype.send = function () {

        this.data["recipient-variables"] = {}
        this.data["to"] = [];

        for (var idx = 0; idx < this.recipients.length ; idx++) {

            this.data["to"].push(this.recipients[idx].email);
            this.data["recipient-variables"][this.recipients[idx].email] = this.recipients[idx].vars;

            if (idx % this.threshold == 0 && idx != 0) {
                //send batch
                mailgun.messages().send(this.data, function(err, body) {
                    if (err) console.dir(err.message);
                    console.dir(body);
                });
                
                //reset recipients
                this.data["recipient-variables"] = {}
                this.data["to"] = [];
            }
        }

        if (this.data["to"].length > 0) {
            //send remaining
            mailgun.messages().send(this.data, function(err, body) {
                if (err) console.dir(err.message);
                console.dir(body);
            });
        }
        
    }


    MailBatch.prototype.prepare = function () {
        var self = this;

        return new Promise(function(resolve, reject){
            var opt = {
                noComm: true, //No Comments
                appRoot: process.cwd(),
                compact: true,
                noCSS: true
            }
            var styliner = new Styliner(opt.appRoot, opt);
            
            fs.readFile(opt.appRoot + self.templatePath, 'utf8', function (err, data) {
                if (err) reject(err);

                var formattedHTML = data.toString();

                styliner.processHTML(formattedHTML)
                    .then(function(resHTML){
                        self.data["html"] = resHTML;
                        resolve();
                    })
                    .catch(function(err){
                        reject(err);
                    })
            });
        })
    }

}).call(this);