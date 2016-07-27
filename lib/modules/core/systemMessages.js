(function () {

'use strict';
    
    var productName = "[Class Buzz] - ";
    var supportIsNotified = "The support team has already been notified. ";
    var furtherAssistance = "If you need further assistance contact us at: support@classbuzz.edu.uy ";
    var mailplate = require('mailplate.js');
    var moment = require('moment');
    var Config = require('../../config');

    module.exports.error = {
        onCreate: function (what) {return productName + "There was an error creating " + what + ". " + supportIsNotified +" "+ furtherAssistance; },
        onFetch: function (what) {return productName + "There was an error fetching " + what + ". " + supportIsNotified +" "+ furtherAssistance; },
        onUpdate: function (what) {return productName + "There was an error updating " + what + ". " + supportIsNotified +" "+ furtherAssistance; },
        onDelete: function (what) {return productName + "There was an error deleting " + what + ". " + supportIsNotified +" "+ furtherAssistance; },
        onAuth: function () {return productName + "There was an error authenticating. " + supportIsNotified +" "+ furtherAssistance; },
        onAction: function (action) {return productName + "There was an error " + action + ". " + supportIsNotified +" "+ furtherAssistance; }
    };

    module.exports.success = {
        onAction: function (action) {return productName + action + " success."},
        onCreate: function (what) {return productName + "Successfully created " + what + "."; },
        onUpdate: function (what) {return productName + "Successfully updated " + what + "."; },
        onDelete: function (what) {return productName + "Successfully deleted " + what + "."; }
    };

    module.exports.feature = {
        notImplemented: function () { return productName + "The feature you are trying to access is not implemented yet. " + furtherAssistance}
    };

    module.exports.data = {
        missing: function(what) { return  what + " missing."; },
        incomplete: function(what) { return what + " incomplete."; },
        missingOrIncomplete: function(what) { return what + " missing, incomplete or invalid."; },
        notFound: function(what) { return what + " not found."; },
        dontExist: function(what) { return what + " does not exist."; },
        duplicate: function(what) { return what + " already exists."; }
    };

    module.exports.auth = {
        notAuthorized: function () { return productName + "No authorized to access this section."; },
        wrongAppKey: function () { return productName + "App Key not authorized."; },
        missingRole: function (extra) { return productName + "The action you are trying to perform is not acceptable. " + extra; }
    };

    module.exports.info = {
        duplicate: function(what) {return productName + "The " + what + " you are trying to insert already exists. " + furtherAssistance;},
        custom: function(msg) {return productName +' '+ msg +' '+ furtherAssistance;}
    };

    module.exports.log = {
        error: function(text, req, err) {

            if (req.user === undefined) {
                return text + "\nStack Trace: " + err.stack;
            }

            return text + "\n Logged User: " + req.user.id +"\n Thrown error: " + err.message + "\n Stack Trace: " + err.stack;
        },

        info: function (text, req) {

            if (req.user === undefined) {
                return text;
            }

            return text + "\n Logged User: " + req.user.id;
        },

        formatHtml: function(err) {

            var templateData = {
                err_link: Config.baseURL + Config.apiVersion +"/error/"+ err._id,
                err_status: err.status,
                err_logged_user: err.user,
                err_timestamp: moment(err.timestamp).format('MMMM Do YYYY, h:mm:ss a'),
                err_reason: err.reason,
                err_from: err.origin || "API Backend",
                err_other_info: err.message,
                err_stack_trace: err.stack
            };

            return mailplate.renderAsync('/lib/templates/inlined/errorNotification.html', templateData)
        }
    };

    module.exports.generic = function () {
        return productName + "Oops, something went wrong. " + supportIsNotified + furtherAssistance;
    };

    module.exports.request = {
        badRequest: function(additionalInfo){
            return productName + "Bad Request: " + additionalInfo + "- " + supportIsNotified + furtherAssistance;
        }
    }

}).call(this);