(function () {
    'use strict';

    var User = require('../users/userModel');
    var Skill = require('../skills/skillModel');
    var config = require('../../config');
    var jwt = require('jsonwebtoken');
    var logger = require('../log/logger').getLogger();
    var messages = require('./../core/systemMessages');
    var customErr = require('./../errors/customErrors');
    var utils = require('./../core/utils');
    var errorHandler = require('./../errors/errorHandler');
    var crypto = require('crypto');
    var mailer = require('./../mailing/mailingController');
    var _ = require('underscore');
    var mailplate = require('mailplate.js');

    module.exports.authenticate = function (req, res) {

        var _loggedUser = {};

        if (!(req.body.username) || !(req.body.password)) {
            logger.warn("There was a request to authenticate without username/password");
            res.status(401).send(messages.data.missingOrIncomplete('Username or password'));
        };

        User.findOne( {'credentials.username': req.body.username})
            .populate('branch', 'name')
            .deepPopulate('roles.mayGrant')
            .then( function (loggedUser) {

                if (!loggedUser) {
                    var e = new customErr.notAuthorizedError("User not found");
                    throw e;
                }

                if (!loggedUser.isActive) {
                    var e = new customErr.notAuthorizedError("User not Active");
                    throw e;
                }

                return utils.bcryptCompareAsync(req.body.password, loggedUser);
            })

            .then( function(loggedUser) {
                _loggedUser = loggedUser;

                return Skill.find()
            })
            .then(function(skills){

                var roleIdx = _.findIndex(_loggedUser.roles, function(r) { return r.name == 'student'} );

                if (roleIdx == -1) return Promise.resolve(_loggedUser);

                _loggedUser.student.character.skills = [];

                skills.forEach(function(s){
                    _loggedUser.student.character.skills.push({
                        skill: s._id,
                        xp: 0
                    });

                });

                return _loggedUser.save();
            })
            .then( function(loggedUser) {

                var jwtUser = {
                    id: loggedUser._id,
                    doc: loggedUser.doc,
                    firstName: loggedUser.firstName,
                    lastName: loggedUser.lastName,
                    email: loggedUser.email,
                    roles: loggedUser.roles,
                    branch: loggedUser.branch,
                    customer: loggedUser.customer,
                    avatarURL: loggedUser.avatarURL,
                    gender: loggedUser.gender,
                    house: loggedUser.student.house
                };


                var token = jwt.sign(jwtUser, config.jwt_secret);

                res.status(200).json({
                    token: token,
                    user: jwtUser
                });

            })
            .catch(function (err) { errorHandler.handleError(err, req, res) });

    };


    module.exports.impersonate = function (req, res) {

        if (!(req.body.username) || !(req.body.password)) {
            logger.warn("There was a request to authenticate without username/password");
            res.status(401).send(messages.data.missingOrIncomplete('Username or password'));
        };

        User.findOne( {'credentials.username': req.body.username})
            .populate('branches', 'name')
            .deepPopulate('roles.mayGrant')
            .then( function (authUser) {

                if (!authUser) {
                    var e = new customErr.notAuthorizedError("User not found");
                    throw e;
                }

                if (!authUser.isActive) {
                    var e = new customErr.notAuthorizedError("User not Active");
                    throw e;
                }

                return utils.bcryptCompareAsync(req.body.password, authUser);
            })

            .then( function(authUser) {

                var isSuperAdmin = false;

                authUser.roles.forEach(function(r){
                    if (r.name == 'super-admin') isSuperAdmin = true;
                });

                if (isSuperAdmin) {
                    return User.findOne({doc: req.body.impersonationDoc})
                        .populate('branches', 'name')
                        .deepPopulate('roles.mayGrant');
                }
                else {
                    var e = new customErr.notAuthorizedError("You are not authorized to impersonate");
                    throw e;
                }

            })

            .then (function(loggedUser){

                if (!loggedUser) {
                    var e = new customErr.notAuthorizedError("Impersonating user not found");
                    throw e;
                }

                var jwtUser = {
                    id: loggedUser._id,
                    doc: loggedUser.doc,
                    firstName: loggedUser.firstName,
                    lastName: loggedUser.lastName,
                    email: loggedUser.email,
                    roles: loggedUser.roles,
                    branches: loggedUser.branches,
                    customer: loggedUser.customer,
                    avatarURL: loggedUser.avatarURL,
                    gender: loggedUser.gender
                };


                //var token = jwt.sign(jwtUser, config.jwt_secret, { expiresInMinutes: config.jwt_expiration });
                var token = jwt.sign(jwtUser, config.jwt_secret);

                res.status(200).json({
                    token: token,
                    user: jwtUser
                });

            })
            .catch(function (err) { errorHandler.handleError(err, req, res) });
    };

    /**
     * Password Recovery Handling functions. Forgot Password
     * @param req
     * @param res
     */
    module.exports.forgotPassword = function (req, res) {

        var _token;
        var _user;

        //Generate Temporary token
        utils.asyncCrypto(20)
            .then( function(buf) {
                _token = buf.toString('hex');
                return User.findOne({email: req.body.email});
            })
            .then( function (user) {
                if (_.isEmpty(user)) {
                    res.status(200).json({status:"Error", message:"No hay ninguna cuenta asociada a ese email."})
                }

                user.resetPasswordToken = _token;
                user.resetPasswordExpires = Date.now() + config.mailer.pass_recovery_token_ttl;

                _user = user;
                return user.save();
            })
            .then( function (result) {
                return mailplate.renderAsync('/lib/templates/inlined/passwordReset.html', {
                    reset_link: 'http://' + req.headers.host + config.mailer.pass_recovery_url + _token,
                    contact_email: config.mailer.contact_email
                });
            })
            .then( function (renderedHTML) {

                var data = {
                    from: config.mailer.from_field,
                    to: _user.email, // list of receivers
                    subject: '[Class Buzz] - Password Recovery', // Subject line
                    html: renderedHTML
                };

                mailer.sendMail(data);

                res.status(200).json({status:"Success", message:"Te enviamos un email para reestablecer tu correo. Puede demorar unos minutos. Alli encontraras mas instrucciones de como completar el proceso"});

            })
            .catch(function (err) { errorHandler.handleError(err, req, res) });
    };

    /**
     * Password recovery handling functions. Reset Password
     * @param req
     * @param res
     */
    module.exports.resetPassword = function (req, res) {
        var _user;

        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }})
            .then( function(user) {
                if (_.isEmpty(user)) {

                    res.render('error', {
                        status: 404,
                        name: "Not Found",
                        desc: "Either you have not requested a password recovery or the time has expired. \n" +
                        "If it is the former please restart the process",
                        baseURL: 'http://'+req.headers.host+'/'
                    });
                }
                _user = user;
                return utils.hashPasswordAsync(req.body.password);
            })
            .then(function(hash) {
                _user.credentials.password = hash;
                _user.resetPasswordToken = undefined;
                _user.resetPasswordExpires = undefined;
                return _user.save();
            })
            .then( function (result) {
                return mailplate.renderAsync('/lib/templates/inlined/passwordConfirmation.html', {
                    user_name: _user.firstName,
                    user_email: _user.email,
                    contact_email: config.mailer.contact_email
                });
            })
            .then( function (renderedHTML) {

                var data = {
                    from: config.mailer.from_field,
                    to: _user.email,
                    subject: '[Class Buzz] - Your Password has been changed',
                    html: renderedHTML
                };

                mailer.sendMail(data);

                res.render('success',{
                    title: "Password Recovery",
                    name: "Recovery Completed",
                    desc: "Your password has been changed correctly. \n Please continue to login screen and login with your new credentials"
                });
            })

            .catch(function (err) { errorHandler.handleError(err, req, res) });


    };

    module.exports.recoveryForm = function (req, res) {
        res.render('forgotPassword', {
            title: 'Recover Password',
            avatarURL: "/images/avatars/empty.png",
            firstName: 'Hi there!',
            lastName: '',
            email: 'Did you forgot your password?'

        });
    };

    module.exports.resetForm = function (req, res) {

        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }})
            .then( function(user) {

                if (_.isEmpty(user)) {
                    res.render('error', {
                        status: 409,
                        name: "Not Authorized",
                        desc: "You have not requested a password reset or the time has expired.",
                        baseURL: 'http://'+req.headers.host+'/'
                    });

                    return;
                }

                res.render('resetPassword', {
                    title: 'Reset Password',
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatarURL: user.avatarURL,
                    email: user.email
                });
            })
            .catch(function (err) { errorHandler.handleError(err, req, res) });
    };

    module.exports.usernameCheck = function (req, res) {
        User.findOne({'credentials.username':req.params.username})
            .then(function(result){
                var resObj = {};
                resObj.available = _.isEmpty(result);
                res.status(200).json(resObj);
            })
            .catch(function (err) { errorHandler.handleError(err, req, res) });
    }

}).call(this);