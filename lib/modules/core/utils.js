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


    module.exports.deprecated = function( req, res ) {
        res.status(400).send("The endpoint you are trying to access is deprecated.");
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
    }

    module.exports.asyncCrypto = function (bytes) {
        return new Promise( function (resolve, reject) {
            crypto.randomBytes(bytes, function(err, buf){
                if (err) reject(err);
                else resolve(buf);
            });
        });
    }

    /**
     * Chects if given object is empty
     * @param obj
     * @returns {boolean}
     */
    module.exports.isEmpty =  function (obj) {

        // null and undefined are "empty"
        if (obj == null) return true;

        // Assume if it has a length property with a non-zero value
        // that that property is correct.
        if (Object.keys(obj).length > 0)    return false;
        if (Object.keys(obj).length === 0)  return true;

        return true;
    };

    /**
     * Function to handle not implemented issues.
     * @param req
     * @param res
     */
    module.exports.featureNotImplemented = function (req, res) {
        logger.info(messages.log.info("Trying to access not implemented feature.", req));
        res.status(501).send(messages.feature.notImplemented());
    };

    /**
     * Returns all elements that belong to arr1 and arr2
     * @param arr1
     * @param arr2
     * @returns {*}
     */
    module.exports.arrayIntersect = function (arr1, arr2) {
        return arr1.filter( function(i){ return arr2.indexOf(i) != -1 } );
    }

    /**
     * Returns all elements that belongs to arr1, or arr2 but not to both
     * @param arr1
     * @param arr2
     * @returns {Array.<T>|string}
     */
    module.exports.arraySymetricDiff= function (arr1, arr2) {
        var res1 = arr1.filter( function(i){ return arr2.indexOf(i) == -1 } );
        var res2 = arr2.filter( function(i){ return arr1.indexOf(i) == -1 } );
        return res1.concat(res2);
    }

    /**
     * Difference of arrays: arr1 - arr2 - All elements of arr1 that are not in arr2
     * @param arr1
     * @param arr2
     */
    module.exports.arrayDifference = function (arr1, arr2) {
        var isect = this.arrayIntersect(arr1, arr2);
        return arr1.filter( function(i){ return isect.indexOf(i) == -1 } );
    }

    /**
     * Handle promise succes
     * @param msg - Message to return
     * @param res
     */
    module.exports.handleSuccess = function(msg, res){

        var resObj = {
            status: 200,
            message: msg
        };

        res.status(200).json(resObj);
    }

    module.exports.getLevelInfo = function ( xp ) {
        var k = 0.2;
        var L = Math.floor(Math.sqrt(xp) * k);
        var XPPrev =  Math.round(Math.pow((L-1)/k, 2));
        var XPNext =  Math.round(Math.pow((L+1)/k, 2));
        var XPCurr =  Math.round(Math.pow((L)/k, 2));

        return {
            xp: xp,
            questXP: 250,
            level: L+1,
            xpToPrevious: XPPrev,
            xpToCurrent: XPCurr,
            xpToNext: XPNext
        }
    };

    module.exports.willLevelUp = function(currentXP, xpAward) {
        var currentLevel = Math.floor( currentXP / 1000 ) + 1;
        var levelWithXPAward = Math.floor( (currentXP + xpAward) / 1000 ) + 1;
        return levelWithXPAward > currentLevel;
    }

    module.exports.willLevelDown = function(currentXP, xpForfeit) {
        var currentLevel = Math.floor( currentXP / 1000 ) + 1;
        var levelWithXPForfeit = Math.floor( (currentXP - xpForfeit) / 1000 ) + 1;
        return levelWithXPForfeit < currentLevel;
    }

    module.exports.getUserLevel = function(xp) {
        return Math.floor( xp / 1000 ) + 1;
    }

    // Retorna un entero aleatorio entre min (incluido) y max (excluido)
    // Usando Math.round()
    module.exports.getRandomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    /**
     * Returns a months
     * @param n
     * @param lang
     */
    module.exports.getMonthName = function(n, lang) {
        var _months = [
            {
                en: 'January',
                es: 'Enero'
            },
            {
                en: 'February',
                es: 'Febrero'
            },
            {
                en: 'March',
                es: 'Marzo'
            },
            {
                en: 'April',
                es: 'Abril'
            },
            {
                en: 'May',
                es: 'Mayo'
            },
            {
                en: 'June',
                es: 'Junio'
            },
            {
                en: 'July',
                es: 'Julio'
            },
            {
                en: 'August',
                es: 'Agosto'
            },
            {
                en: 'September',
                es: 'Septiembre'
            },
            {
                en: 'October',
                es: 'Octubre'
            },
            {
                en: 'November',
                es: 'Noviembre'
            },
            {
                en: 'December',
                es: 'Diciembre'
            }
        ]

        return _months[n-1][lang];
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