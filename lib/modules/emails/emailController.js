(function(){
    'use strict';

    var emailModel = require('./emailModel');
    var errorHandler = require('../errors/errorHandler');
    var mailplate = require('mailplate.js');
    var config = require('../../config');
    var groupModel = require('../groups/groupModel');
    var userModel = require('../users/userModel');
    var mailer = require('../mailing/mailingController');
    var _ = require('underscore');


    module.exports.create = function(req, res) {
        newEmail(req.body)
            .then(function(result){ res.status(200).json(result); })
            .catch(function(err){ errorHandler.handleError(err, req, res) })
    };

    /**
     * Creates a new email document to target user and sends it.
     * @param req
     * @param res
     *
     * @bodyParam user - The id of the targeted user
     * @bodyParam msg - The message object eg: {subject:"xx", body:"xx"}
     */
    module.exports.sendToUser = function(req, res){
        newMailToUser(req.user.id, req.body.user, req.body.msg)
            .then(function(_mail){ return adHocNewsletter(_mail._id) })
            .then(function(result){ res.status(200).json(result); })
            .catch(function(err){ errorHandler.handleError(err, req, res) })
    };

    /**
     * Creates a new email document to target group and sends it to all students of such group
     * @param req
     * @param res
     *
     * @bodyParam group - The id of the targeted group
     * @bodyParam msg - The message object eg: {subject:"xx", body:"xx"}
     */
    module.exports.sendToGroup = function(req, res){
        newMailToGroup(req.user.id, req.body.group, req.body.msg)
            .then(function(_mail){ return adHocNewsletter(_mail._id) })
            .then(function(result){ res.status(200).json(result); })
            .catch(function(err){ errorHandler.handleError(err, req, res) })
    };

    /**
     * Creates a new email document to target an array of groups and sends it to all students of such groups
     * @param req
     * @param res
     *
     * @bodyParam groups - An array containing the ids of the groups
     * @bodyParam msg - The message object eg: {subject:"xx", body:"xx"}
     */
    module.exports.sendToGroups = function(req, res){
        newMailToGroups(req.user.id, req.body.groups, req.body.msg)
            .then(function(_mail){ return adHocNewsletter(_mail._id) })
            .then(function(result){ res.status(200).json(result); })
            .catch(function(err){ errorHandler.handleError(err, req, res) })
    }

    /**
     * Creates a new email document to target a branch and sends it to all students of such branch
     * @param req
     * @param res
     *
     * @bodyParam branch - The branch id that must be targeted
     * @bodyParam msg - The message object eg: {subject:"xx", body:"xx"}
     */
    module.exports.sendToBranch = function(req, res){
        newMailToBranch(req.user.id, req.body.branch, req.body.msg)
            .then(function(_mail){ return adHocNewsletter(_mail._id) })
            .then(function(result){ res.status(200).json(result); })
            .catch(function(err){ errorHandler.handleError(err, req, res) })
    }

    /**
     * Archives mails targeted
     * @param req
     * @param res
     *
     * @bodyParam ids - An array containing the ids of the mails that should be archived
     */
    module.exports.archive = function(req, res) {
        emailModel.update({_id:{ $in: req.body.ids }},{archived:true}, {multi:true})
            .then(function(result){ res.status(200).json(result); })
            .catch(function(err){ errorHandler.handleError(err, req, res) })
    };

    /**
     * Restores/Unarchives the mails targeted
     * @param req
     * @param res
     *
     * @bodyParam ids - An array containing the ids of the mails that should be restored/unarchived
     */
    module.exports.restore = function(req, res) {
        emailModel.update({_id:{ $in: req.body.ids }},{archived:false}, {multi:true})
            .then(function(result){ res.status(200).json(result); })
            .catch(function(err){ errorHandler.handleError(err, req, res) })
    };

    /**
     * Archives mails targeted
     * @param req
     * @param res
     *
     * @bodyParam id - An id of the mail that should be deleted
     */
    module.exports.delete = function(req, res) {
        emailModel.findOneAndRemove({_id: req.body.id})
            .then(function(result){ res.status(200).json(result); })
            .catch(function(err){ errorHandler.handleError(err, req, res) })
    };

    module.exports.find = {
        all: function(req, res){
            emailModel.find()
                .then(function(result){ res.status(200).json(result); })
                .catch(function(err){ errorHandler.handleError(err, req, res) })
        },

        id: function(req, res){
            emailModel.find({_id:req.id})
                .then(function(result){ res.status(200).json(result); })
                .catch(function(err){ errorHandler.handleError(err, req, res) })
        },

        inbox: function(req, res){
            emailModel.find({to:req.params.userId})
                .and({archived:false})
                .populate('from to')
                .then(function(result){ res.status(200).json(result); })
                .catch(function(err){ errorHandler.handleError(err, req, res) })
        },

        outbox: function(req, res){
            emailModel.find({from:req.params.userId})
                .and({archived:false})
                .populate('to','firstName lastName avatarURL')
                .then(function(result){ res.status(200).json(result); })
                .catch(function(err){ errorHandler.handleError(err, req, res) })
        },

        archived: function(req, res){
            emailModel.find()
                .or({from:req.params.userId})
                .or({to:req.params.userId})
                .and({archived:true})
                .populate('to','firstName lastName avatarURL')
                .then(function(result){ res.status(200).json(result); })
                .catch(function(err){ errorHandler.handleError(err, req, res) })
        },

        query: function(req, res){
            emailModel.find(req.body)
                .populate('from','firstName lastName avatarURL')
                .then(function(result){ res.status(200).json(result); })
                .catch(function(err){ errorHandler.handleError(err, req, res) })
        }

    };

    function newEmail(data){
        var _email = new emailModel(data);
        return _email.save();
    }


    function newMailToGroups(fromId, toGroups, msg){

        //Create an email for all group students.
        var newMail = new emailModel();
        newMail.from = fromId;
        newMail.subject = msg.subject;
        newMail.body = msg.body;
        newMail.to_groups = toGroups;
        newMail.dateQueued = new Date();

        var promises = [];

        toGroups.forEach(function(_gr){
            promises.push (
                groupModel.findOne({_id:_gr})
                .then(function(_fullGroup){
                    newMail.to = newMail.to.concat(_fullGroup.students);
                })
            )
        })

        return Promise.all(promises)
            .then(function(result){
                return newMail.save();
            })
    }

    function newMailToGroup(fromId, groupId, msg){
       return groupModel.findOne({_id:groupId})
            .then(function(group) {

                //Create an email for all group students.
                var newMail = new emailModel();
                newMail.from = fromId;
                newMail.to = group.students;
                newMail.to_groups = [groupId];
                newMail.subject = msg.subject;
                newMail.body = msg.body;
                newMail.dateQueued = new Date();

                return newMail.save();
            })
    }


    function newMailToUser(fromId, userId, msg){

        //Create an email for all group students.
        var newMail = new emailModel();
        newMail.from = fromId;
        newMail.to = userId;
        newMail.subject = msg.subject;
        newMail.body = msg.body;
        newMail.dateQueued = new Date();

        return newMail.save();
    }


    function newMailToBranch(fromId, branchId, msg){

        return userModel.find({branches:branchId})
            .then(function(_users){
                var _usrIds = _users.map(function(u){
                    return u._id;
                })

                //Create an email for all group students.
                var newMail = new emailModel();
                newMail.from = fromId;
                newMail.to = _usrIds;
                newMail.to_branch = branchId;
                newMail.subject = msg.subject;
                newMail.body = msg.body;
                newMail.dateQueued = new Date();

                return newMail.save();
            })
    }


    function adHocNewsletter(emailId){
            var _from, _to;

            return emailModel.findOne({_id:emailId})
                .populate('from to')
                .then(function(email){

                    _from = email.from;
                    _to = email.to;

                    var templateData = {
                        mail_from: email.from.firstName + ' ' + email.from.lastName,
                        mail_subject: email.subject,
                        mail_body: email.body
                    };

                    return mailplate.renderAsync('/lib/templates/inlined/parentNewsletterAdHoc.html', templateData)
                })
                .then(function(renderedHTML){

                    _to.forEach(function(_st){

                        var data = {
                            from: config.mailer.from_field,
                            to: _st.student.parent.email,
                            subject: '[Class Buzz] - Circular' ,
                            html: renderedHTML
                        };

                        mailer.sendMail(data);

                        if (_st.student.parent2.email != "") {
                            //Send same mail to second parent
                            var data = {
                                from: config.mailer.from_field,
                                to: _st.student.parent2.email,
                                subject: '[Class Buzz] - Circular',
                                html: renderedHTML
                            };

                            mailer.sendMail(data);
                        }

                    });

                    return {status:"Mail Sent OK"};
                })
                .catch(function(err){
                    errorHandler.handleError(err)
                })
    }

}).call(this);
