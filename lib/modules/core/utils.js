(function () {

'use strict';

    var bcrypt = require('bcrypt');
    var config = require('../../config');
    var logger = require('../log/logger').getLogger();
    var messages = require('./systemMessages');
    var customErr = require('./../errors/customErrors');
    var crypto = require('crypto');
    var fs = require('fs');
    var path = require('path');
    var aws = require('./aws');
    var traitModel = require('../traits/traitModel');
    var _ = require('lodash');

    //Lodash Mixins
    //====================================

    /**
     * Generates a Random string of length == size
     * @param size
     * @returns {string}
     */
    function randStr(size) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < size; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    _.mixin({randomString: randStr});

    //========================================

    module.exports.deprecated = function( req, res ) {
        res.status(400).send("The endpoint you are trying to access is deprecated. Check docs for new version.");
    };

    /**
     * Generates salt and hash async.
     * @param pass String
     * @returns {Promise}
     */
    module.exports.hashPasswordAsync = function (pass) {

        return new Promise (function (resolve, reject) {

            bcrypt.genSalt( config.salt_work_factor, function(err, salt) {

                if(err) {
                    // Error Generating Salt
                    var e = new customErr.severeError("Error generating salt when creating user.");
                    reject(e);
                }

                // HASH
                bcrypt.hash(pass, salt, function(err, hash) {

                    if(err) {
                        // Error Hashing
                        var e = new customErr.severeError("Error hashing salted password.");
                        reject(e);
                    }

                    resolve(hash);

                });

            });
        });

    };

    module.exports.bcryptCompareAsync = function (sentPassword, loggedUser){

        return new Promise( function (resolve, reject) {

            // Compare retrieved password with sent password using salt.
            bcrypt.compare(sentPassword, loggedUser.credentials.password, function (err, isMatch) {

                if (err) {
                    var e = new customErr.severeError("Internal error comparing hashes.");
                    reject(e);
                }

                if (isMatch) {
                    resolve(loggedUser);
                }

                else {
                    var e = new customErr.notAuthorizedError("Wrong username or password.");
                    reject(e);
                }

            });
        });
    };

    module.exports.asyncCrypto = function (bytes) {
        return new Promise( function (resolve, reject) {
            crypto.randomBytes(bytes, function(err, buf){
                if (err) reject(err);
                else resolve(buf);
            });
        });
    }

    module.exports.batchUploadTraits = function(req, res) {
        var rootDir = '/Users/Daniel/Desktop/traits/modularChar';

        var totalFiles = 0;
        var totalUploaded = 0;

        // FIRST LEVEL body.eyes
        fs.readdir(rootDir, function(err, files) {

            files.forEach(function(f){

                if (f == '.DS_Store' || f == 'thumbnails' || f == 'Thumbs.db') return;

                var nextPath = path.join(rootDir, f);

                //SECOND LEVEL bodyEyes1.x0.y0
                fs.readdir(nextPath, function(err, files){

                    files.forEach(function (f1) {

                        if (f1 == '.DS_Store' || f1 == 'thumbnails' || f1 == 'Thumbs.db') return;

                        var lastPath = path.join(nextPath, f1);

                        //LAST LEVEL bodyEyes1-02.png
                        fs.readdir(lastPath, function(err, files){

                            totalFiles += files.length;

                            files.forEach(function (f2) {

                                if (f2 == '.DS_Store' || f2 == 'thumbnails' || f2 == 'Thumbs.db' || f2 == 'backImages') return;

                                var trait = {};
                                trait.traitType = f.split('.')[0];
                                trait.placement = f.split('.')[1];
                                trait.offsetX = f1.split('.')[1].substr(1);
                                trait.offsetY = f1.split('.')[2].substr(1);
                                trait.offsetBackX = f1.split('.')[3].substr(2);
                                trait.offsetBackY = f1.split('.')[4].substr(2);
                                trait.name = f2.split('.')[0];
                                trait.extension = f2.split('.')[1];

                                var foreUploadPath = path.join(lastPath, f2);
                                var backUploadPath = path.join(lastPath, 'backImages', f2);
                                var thumbUploadPath = path.join(lastPath,'thumbnails', trait.name +'_thumb.' + trait.extension);

                                // UPLOAD THUMBNAIL
                                console.log('Upload Started For: ', foreUploadPath);
                                //UPLOAD FORE IMAGE
                                aws.uploadToS3(foreUploadPath, function(err, s3Path){
                                    if (!err) {
                                        trait.foreImageURL = s3Path;


                                        console.log('Fore OK: '.green, foreUploadPath.green);
                                        console.log('======================'.green);

                                        aws.uploadToS3(thumbUploadPath, function(err, s3Path){

                                            if (!err) {
                                                trait.previewImageURL = s3Path;

                                                console.log('Thumb OK: '.blue, thumbUploadPath.blue);
                                                console.log('======================'.blue);

                                                aws.uploadToS3(backUploadPath, function(err, s3Path){

                                                    if (!err) {

                                                        trait.backImageURL = s3Path;
                                                        console.log('Back OK: ', backUploadPath);
                                                        console.log('======================');

                                                        var newTrait = new traitModel(trait);
                                                        newTrait.save().
                                                            catch(function (result) {
                                                                console.log('======================'.yellow);
                                                                console.log('Error Saving Trait:'.yellow, result.toString().yellow);
                                                                console.log('======================'.yellow);
                                                            })
                                                    }

                                                    else {

                                                        console.log('Error Uploading Back Image: '.yellow, backUploadPath.yellow);
                                                        console.log('Err: '.yellow + err);
                                                        console.log('======================'.yellow);
                                                    }


                                                }.bind(this))

                                            }

                                            else {

                                                console.log('Error Uploading Tumb Image: '.yellow, thumbUploadPath.yellow);
                                                console.log('Err: '.yellow + err);
                                                console.log('======================'.yellow);
                                            }

                                        }.bind(this))
                                    }

                                    else {

                                        console.log('Error Uploading Fore Image: '.yellow, foreUploadPath.yellow);
                                        console.log('Err: '.yellow + err);
                                        console.log('======================'.yellow);
                                    }

                                }.bind(this))

                            })
                        })

                    })
                })

            })
        })

    };

}).call(this);