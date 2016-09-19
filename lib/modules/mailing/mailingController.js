(function(){
    'use strict';


    var config = require('../../config');
    var mailgun = require('mailgun-js')({
        apiKey: config.mailgun.apiKey,
        domain: config.mailgun.domain
    });

    var fs = require('fs');

    if (process.env.DUMMY_MAILER == "true") console.info("[classbuzz] Mailer set to DUMMY".yellow);
    else console.info("[classbuzz] Mailer set to LIVE".green);

    module.exports.sendMail = sendMail;

    function sendMail(data, cb) {
        if (process.env.DUMMY_MAILER == "true") return sendDummyMail(data,cb);
        else return sendLiveMail(data, cb);
    }

    /**
     * Sends an email through mailgun api.
     * If there is a callback function then calls that function upon finishing. Otherwise returns a promise.
     * Returne data contains mailgun messageId. Which is used for further updates on the record.
     * Data structure is as follows:
     *
     * var data = {
     *      from: from,
     *      to: to,
     *      subject: subject,
     *      text: text
     *  }
     *
     * @param data
     * @param cb
     * @returns {Promise}
     */
    function sendLiveMail( data, cb ){

        if (typeof data.to == "undefined" || data.to == null || data.to == "") return;

        // If it has callback, exec callback, else return promise
        if (typeof cb == 'function') {
            mailgun.messages().send(data, cb);
        }

        else {

            return new Promise( function(resolve, reject){
                mailgun.messages().send(data, function (error, body) {

                    if (error) {
                        reject(error);
                    }

                    else {
                        resolve(body);
                    }

                });
            });
        }

    }


    /**
     * Dummy function to test mailing process.
     * @param data
     * @param cb
     * @returns {Promise}
     */
    function sendDummyMail( data, cb ){

        if (typeof data.to == "undefined" || data.to == null || data.to == "") return;

        fs.writeFile("/data/classbuzz/mailProcessHTML/" + data.to + '.html', data.html, function(err) {
            if(err) { return console.log(err); }
        });

        // If it has callback, exec callback, else return promise
        if (typeof cb == 'function') {
            console.log("Mail sent emulated to ", data.to);
            cb(null, {
                id: '<20160428205804.12698.67373.8B2A4F19@classbuzz.edu.uy>',
                message: 'Queued. Thank you.'
            });
        }
        else {

            return new Promise( function(resolve, reject){
                console.log("Mail sent emulated to ", data.to);
                resolve({
                    id: '<20160428205804.12698.67373.8B2A4F19@classbuzz.edu.uy>',
                    message: 'Queued. Thank you.'
                });
            });
        }

    }



}).call(this)
