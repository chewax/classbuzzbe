(function () {
    'use strict';

    var fs = require('fs');
    var Config = require('../../config');
    var crypto = require('crypto');

    require('datejs');

    var AWS = require('aws-sdk');
    AWS.config.update({
        accessKeyId: Config.S3.accessKeyId,
        secretAccessKey: Config.S3.secretAccessKey,
        region: 'sa-east-1',
        maxRetries: 5
    });

    var createS3Policy;
    var getExpiryTime;
    var uploadToS3;

    getExpiryTime = function () {
        //return new Date().addDay(1);
        var _date = new Date();
        return '' + (_date.getFullYear()) + '-' + (_date.getMonth() + 1) + '-' +
            (_date.getDate() + 1) + 'T' + (_date.getHours() + 3) + ':' + '00:00.000Z';
    };


    createS3Policy = function(contentType, callback) {
        var date = new Date();
        var s3Policy = {
            'expiration': getExpiryTime(),
            'conditions': [
                ['starts-with', '$key', 'uploads/'],
                {'bucket': Config.S3.bucket},
                {'acl': 'public-read-write'},
                //['starts-with', '$Content-Type', contentType],
                ['starts-with', '$Content-Type', 'image/'],
                {'success_action_status' : '201'}
            ]
        };

        // stringify and encode the policy
        var stringPolicy = JSON.stringify(s3Policy);
        var base64Policy = new Buffer(stringPolicy, 'utf-8').toString('base64');

        // sign the base64 encoded policy
        var signature = crypto.createHmac('sha1', Config.S3.secretAccessKey)
            .update(new Buffer(base64Policy, 'utf-8')).digest('base64');

        // build the results object
        var s3Credentials = {
            s3Policy: base64Policy,
            s3Signature: signature,
            AWSAccessKeyId: Config.S3.accessKeyId
        };

        // send it back
        callback(s3Credentials);
    };

    uploadToS3 = function(filePath, cb){
        var s3 = new AWS.S3();

        var fileExtension = filePath.split('.').pop();
        var mimetype = 'image/' + fileExtension;
        var fileName = makeRandomName(30) + '.' + fileExtension;
        var key = 'uploads/' + fileName;
        var fileBuffer = fs.readFileSync(filePath);

        return s3.putObject({

            ACL: 'public-read-write',
            Bucket: Config.S3.bucket,
            Key: key,
            Body: fileBuffer,
            ContentType: mimetype

        }, function(err, result){
            cb(err, Config.S3.base + 'uploads%2F' + fileName);
        });

    }

    /**
     * Makes Random Name for Pictures
     * @returns {string}
     */
    function makeRandomName (length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    exports.uploadToS3 = uploadToS3;

    exports.getS3Policy = function(req, res) {
        createS3Policy(req.body.mimeType, function (creds, err) {
            if (!err) {
                return res.status(200).json(creds);
            } else {
                return res.status(500).send(err);
            }
        });
    };


}).call(this);
