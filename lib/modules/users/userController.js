(function () {
    'use strict';

    var User = require('./userModel');
    var Skill = require('../skills/skillModel');
    var Role = require('../roles/roleModel');
    var Quest = require('../quests/questModel');
    var Group = require('../groups/groupModel');
    var Activity = require('../activities/activityModel');
    var Trait = require('../traits/traitModel');
    var SpecialEvents = require('../specialEvents/specialEventsModel');

    var groupController = require('../groups/groupController');
    var houseController = require('../houses/houseController');
    var eventController = require('../events/eventController');
    var statusMailsController = require('../mailing/statusMailController');
    var mailer = require('../mailing/mailingController');

    var config = require('../../config');
    var utils = require('../core/utils');

    var authMid = require('../access/accessUtils');
    var logger = require('../log/logger').getLogger();
    var messages = require('../core/systemMessages');
    var customErr = require('../errors/customErrors');
    var errorHandler = require('../errors/errorHandler');
    var eh = require('../core/eventsHandler');
    var mongoose = require('../../database').Mongoose;
    var Promise = require("bluebird");

    var mailplate = require('mailplate.js');
    var _ = require("lodash");

    var moment = require('moment');
    var fs = require('fs');

    module.exports.achievements = {

        /**
         * Returns User Achievements
         * @param req
         * @param res
         */
        all: function(req, res) {
            User.findOne({_id: req.params.id})
                .populate('student.achievements.achievement')
                .then(function(user){
                    if (user != null) {
                        res.status(200).json(user.student.achievements)
                    }
                    else {
                        res.status(404).send("User not found.")
                    }
                })
                .catch(function (err) { errorHandler.handleError(err, req, res) })
        }

    }

    module.exports.updateAvatarURL = function (req, res) {

        User.findOneAndUpdate( {_id: req.body._id}, {avatarURL:req.body.avatarURL}, {upsert:false})
            .then( function (result){ res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res) });
    };

    module.exports.notImplemented = function(req, res) {
        console.log("Not Implemented Call");
        res.status(200).send("Not Implemented");
    };

    /**
     * Update an user. Must send new values as JSON body
     * @param req
     * @param res
     */
    module.exports.update = function (req, res) {

        var userid = req.body._id;
        delete req.body._id;
        var data = req.body;

        User.findByIdAndUpdate( userid, data, {upsert:false, new:true})
            .then( function (results){ res.status(200).json(results) })
            .catch(function (err) { errorHandler.handleError(err, req, res) });
    };

    /**
     * Creates new student as sent in JSON Body. To be called logged out
     * @param req
     * @param res
     */
    module.exports.newStudent = function (req, res) {

        if (!(req.body) || !(req.body.credentials) || !(req.body.credentials.username) || !(req.body.credentials.password)) {
            res.status(400).send(messages.data.missingOrIncomplete("Credentials"));
            return;
        }

        if (!(req.body.doc)) {
            res.status(400).send(messages.data.missingOrIncomplete("Document"));
            return;
        }

        var plainPassword = req.body.credentials.password;
        var _newUser;

        utils.hashPasswordAsync(req.body.credentials.password)
            .then (function (hash) {
                req.body.credentials.password = hash;
                var newUser = new User( req.body );
                newUser.roles = [];
                newUser.addRole( 'student' );

                //Create a character for him/her
                newUser.student.character = {};
                newUser.student.character.traits = {};

                //Asign default avatar
                if ( newUser.gender == 'M' ) newUser.avatarURL = config.default_avatar.male;
                else newUser.avatarURL = config.default_avatar.female;

                _newUser = newUser;
                return Skill.find({customer: _newUser.customer})
            })
            .then(function(skills){

                _newUser.student.character.skills = [];

                skills.forEach(function(s){

                    _newUser.student.character.skills.push({
                        skill: s._id,
                        xp: 0
                    });

                });

                return _newUser.save();
            })
            .then (function(result){

                _newUser = result;

                return mailplate.renderAsync('/lib/templates/inlined/passwordNotification.html', {
                    user_name: req.body.firstName,
                    user_username: req.body.credentials.username,
                    user_password: plainPassword,
                    student_login_url: "http://ec2-54-94-155-99.sa-east-1.compute.amazonaws.com:9000/"
                });
            })
            .then( function (renderedHTML) {
                var data = {
                    from: config.mailer.from_field,
                    to: req.body.email,
                    subject: 'Bienvenido a Class Buzz',
                    html: renderedHTML
                };

                mailer.sendMail(data);

                //Strip info from user to be returned.
                var _publicUser = {};
                _publicUser._id = _newUser._id;
                _publicUser.doc = _newUser.doc;
                _publicUser.firstNAme = _newUser.firstName;
                _publicUser.lastName = _newUser.lastName;
                _publicUser.email = _newUser.email;

                res.status(200).json(_publicUser);

            })
            .catch(function (err) {
                console.log(err);
                errorHandler.handleError(err, req, res)
            });
    };

    module.exports.status = {
        set: function(req, res) {
            User.findOneAndUpdate( {_id: req.params.id}, {$set: {isActive:req.body.isActive} }, {upsert:false})
                .then( function (result){ res.status(200).json(result); })
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        },

        get: function(req, res) {
            User.findOne( {_id: req.params.id})
                .select('isActive')
                .then( function (results){ res.status(200).json(results); })
                .catch(function (err) { errorHandler.handleError(err, req, res); });
        }
    }

    /**
     * Creates new user as sent in JSON Body
     * @param req
     * @param res
     */
    module.exports.newUser = function (req, res) {

        if (!(req.body) || !(req.body.credentials) || !(req.body.credentials.username) || !(req.body.credentials.password)) {
            res.status(400).send(messages.data.missingOrIncomplete("Credentials"));
            return;
        }

        if (!(req.body.doc)) {
            res.status(400).send(messages.data.missingOrIncomplete("Document"));
            return;
        }

        if (req.body.customer == "") req.body.customer = null;

        utils.hashPasswordAsync(req.body.credentials.password)
            .then (function (hash) {
            req.body.credentials.password = hash;
            var newUser = new User(req.body);

            //Asign default avatar
            if ( newUser.gender == 'M' ) newUser.avatarURL = config.default_avatar.male;
            else newUser.avatarURL = config.default_avatar.female;

            return newUser.save();
        })

        .then (function (_newUser) {

            //Strip info from user to be returned.
            var _publicUser = {};
            _publicUser._id = _newUser._id;
            _publicUser.doc = _newUser.doc;
            _publicUser.firstNAme = _newUser.firstName;
            _publicUser.lastName = _newUser.lastName;
            _publicUser.email = _newUser.email;

            res.status(200).json(_publicUser);

        })
        .catch(function (err) { errorHandler.handleError(err, req, res)});

    };

    /**
     * Removes User by Document
     * @param req
     * @param res
     */
    module.exports.remove = function (req, res) {

        var _user;

        User.findOne({_id: req.body.id})
            .then(function(user){
                _user = user;
                return groupController.removeStudentFromGroups(user._id);
            })
            .then(function(result){
                return _user.remove();
            })
            .then (function (result) {
                res.status(200).json(result)
            })
            .catch(function (err) {
                errorHandler.handleError(err, req, res)
            });
    };

    module.exports.leaderboards = function (req, res){
        var nextRanked = [];
        var prevRanked = [];
        var qUser;
        var qRole;

        Role.findOne({name:"student"})

            .then(function (role) {
                qRole = role;
                return User.findOne({doc:req.params.doc})
                    .and({roles:role._id})
                    .select('firstName lastName student customer roles')
            })

            .then(function(user){
                qUser = user;

                //Find the students that are ranked next
                return User.find({'student.character.xp': {$gt: qUser.student.character.xp}})
                    .and([{customer: qUser.customer},{roles:qRole._id}])
                    .select('firstName lastName student customer roles')
                    .sort({'student.character.xp':1})
                    .limit(5)
            })

            .then(function(result){
                nextRanked = result;

                //Find the students that are ranked prev
                return User.find({'student.character.xp': {$lt: qUser.student.character.xp}})
                    .and([{customer: qUser.customer},{roles:qRole._id}])
                    .select('firstName lastName student customer roles')
                    .sort({'student.character.xp':-1})
                    .limit(5)
            })

            .then (function (result) {

                prevRanked = result;
                prevRanked.push(qUser);
                var leaderboard = prevRanked.concat(nextRanked);
                res.status(200).json(leaderboard);
            })
            .catch(function (err) {errorHandler.handleError(err, req, res)});

    };

    module.exports.student = {


        findCompletedSpecialEvents: function(req, res) {
            User.findOne({_id:req.params.id})
                .populate('student.character.specialEvents.specialEvent')
                .deepPopulate('student.character.specialEvents.specialEvent.skills')
                .then(function(user){
                    res.status(200).json(user.student.character.specialEvents);
                })
        },

        findSpecialEvents: function(req, res) {
            User.findOne({_id:req.params.id})
                .then(function(user){
                    SpecialEvents.getActive(user)
                        .then(function(sEvents){
                            res.status(200).json(sEvents);
                        })
                        .catch(function (err) { errorHandler.handleError(err, req, res)});
                })
        },

        findTeachers: function(req, res) {
            User.findStudentTeachers(req.params.id)
                .then(function(teachers){
                    res.status(200).json(teachers);
                })
                .catch(function (err) {errorHandler.handleError(err, req, res)});
        },

        findByTeacher: function(req, res) {

            //Find the teacher
            User.findTeacherStudents(req.params.id)
                .then(function(students){
                    res.status(200).json(students);
                })
                .catch(function (err) {errorHandler.handleError(err, req, res)});
        },

        findByTeacherPaginate: function(req, res) {

            //Get Teacher Groups
            Group.find({teacher: req.params.id})
                .then(function(groups){

                    //Get students of that groups
                    var _students = [];
                    groups.forEach(function(g){
                        //Convert each value to string to be able to compare
                        g.students.forEach(function(s){
                            _students.push(s.toString());
                        })
                    });

                    _students = _.uniq(_students);

                    var pagOptions = {
                        page: req.body.page || 1,
                        limit: req.body.limit || 10,
                        columns: 'doc firstName lastName email avatarURL student.parent student.character house',
                        populate: 'roles student.house',
                        lean: true
                    };

                    return User.paginate({_id:{$in:_students}}, pagOptions)
                })
                .then(function(_students){
                    res.status(200).json(_students);
                })
                .catch(function(err){
                    errorHandler.handleError(err, req, res);
                })

        },
    }

    /**
     * Search/Find handling Functions
     * @type {{all: Function, one: Function, studentNotInGroup: Function, autocomplete: Function, paginate: Function}}
     */
    module.exports.find = {

        getAvatar: function(req, res) {

            User.findOne({_id:req.params.id})
                .then(function(user){
                    res.status(200).json({uri:user.avatarURL});
                })
                .catch(function(err){
                    errorHandler.handleError(err, req, res);
                })
        },

        exists: function(req, res){
            var query = {};
            if (typeof req.params.id != 'undefined') query = {_id:req.params.id};
            if (typeof req.params.doc != 'undefined') query = {doc:req.params.doc};

            User.findOne(query)
                .then(function(user){
                    if (_.isEmpty(user) || _.isNull(user)) {
                        res.status(200).json({exists:false});
                        return;
                    }
                    else {
                        res.status(200).json({exists:true});
                        return;
                    }
                })
                .catch(function(err){
                    errorHandler.handleError(err, req, res);
                })
        },

        /**
         * Returns all users
         * @param req
         * @param res
         */
        all: function (req, res) {

            User.find({},'-__v -credentials -activity')
                .populate('groupsBelonging groupsOwned student.house')
                .deepPopulate('roles.mayGrant parent.children')
                .then( function (results){ res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});

        },

        /**
         * Find a username by document. Sends a HTTP response
         * @param  {request}
         * @param  {response}
         */
        one: function (req, res) {

            User.findOne( {_id: req.params.id}, '-__v -credentials -activity')
                .populate('groupsBelonging groupsOwned student.house branches')
                .deepPopulate('roles.mayGrant parent.children')
                .then(function (user){

                    if (_.isEmpty(user) || _.isNull(user)) {
                        var e = new customErr.notFoundError('User Not Found', 'User Not Found', 400);
                        throw e;
                    }

                    res.status(200).json(user) ;
                })
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        },

        /**
         * Find a username by document. Sends a HTTP response
         * @param  {request}
         * @param  {response}
         */
        publicProfile: function (req, res) {
            User.findOne( {_id: req.params.id}, '-__v -activity -credentials')
                .populate('groupsBelonging groupsOwned student.house branch customer roles student.character.skills.skill')
                .then(function (results){
                    res.status(200).json(results);
                })
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        },

        /**
         * Finds all Users that have student role and that do not belong in certain group
         * @param req
         * @param res
         */
        studentNotInGroup: function (req, res) {
            var reTerm = req.body.searchField;
            var terms = reTerm.split(" ");
            if (terms.length > 1) {
                reTerm = terms[0];
                for (var i = 1; i < terms.length; i++ ) {
                    reTerm = reTerm + "|" + terms[i]  ;
                }
            }

            var re = new RegExp(reTerm, "i"); // i = case insensitive
            var limit = req.body.searchLimit || 10;

            var orFilters = [{ firstName: { $regex: re }}, { lastName: { $regex: re }}]; // Compile OR filters
            var andFilters = [{branch: req.body.branch}, {groups: {$nin:[req.body.group]}}];

            Role.findOne({name:"student"})
                .then( function(role) {
                    return User.find({roles:role._id})
                        .select("doc firstName lastName avatarURL student.character student.house branches groups")
                        .populate("student.house")
                        .or(orFilters)
                        .and(andFilters)
                        .limit(limit)
                })
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        },

        /**
         * Search Autocomplete. Performs autocomplete query.
         * body : {
         *      searchField: "text" // The text to search. Will search in firstName and lastName fields
         *      searchFilters: {    // Optional
         *          group: "text"
         *          branch: "text"
         *          house: "text"
         *      }
         *      searchLimit: number // Optional, the amount of records to be returned. Defaults to 5
         * }
         * @param req - The http request
         * @param res - The http response
         */
        autocomplete: function (req, res) {

            var re = new RegExp(req.body.searchField, "i"); // i = case insensitive
            var limit = req.body.searchLimit || 5;

            var orFilters = [{ firstName: { $regex: re }}, { lastName: { $regex: re }}]; // Compile OR filters
            var andFilters = [];

            // Compile AND filters
            if (mongoose.Types.ObjectId.isValid(req.body.searchFilters.branch)) andFilters.push({'branch': req.body.searchFilters.branch});
            if (mongoose.Types.ObjectId.isValid(req.body.searchFilters.group)) andFilters.push({'groups': req.body.searchFilters.group});
            if (mongoose.Types.ObjectId.isValid(req.body.searchFilters.house)) andFilters.push({'house': req.body.searchFilters.house});
            if (mongoose.Types.ObjectId.isValid(req.body.searchFilters.role)) andFilters.push({'roles': req.body.searchFilters.role});
            if (mongoose.Types.ObjectId.isValid(req.body.searchFilters.customer)) andFilters.push({'customer': req.body.searchFilters.customer});

            if (andFilters.length > 0) {

                User.find()
                    .select("doc firstName lastName")
                    .or(orFilters)
                    .and(andFilters)
                    .limit(limit)
                    .then(function (results){ res.status(200).json(results) ;})
                    .catch(function (err) { errorHandler.handleError(err, req, res) });
            }

            else {

                User.find()
                    .select("doc firstName lastName")
                    .or(orFilters)
                    .limit(limit)
                    .then(function (results){ res.status(200).json(results) ;})
                    .catch(function (err) { errorHandler.handleError(err, req, res) });
            }
        },

        /**
         * Search user as in searchField field and returns result as pagination as requested
         * {
         *  page: number,
         *  limit: number
         *  searchField: string
         * }
         * @param req
         * @param res
         */
        paginate: function (req, res) {

            var reTerm = req.body.searchField;

            var terms = reTerm.split(" ");

            if (terms.length > 1) {
                reTerm = terms[0];
                for (var i = 1; i < terms.length; i++ ) {
                    reTerm = reTerm + "|" + terms[i]  ;
                }
            }

            //var re = new RegExp(req.body.searchField, "i"); // i = case insensitive
            var re = new RegExp(reTerm, "i"); // i = case insensitive

            var orFilters = [{ firstName: { $regex: re }}, { lastName: { $regex: re }}, { doc: { $regex: re }}]; // Compile OR filters
            var andFilters = [];

            var maySee = [];
            req.user.roles.forEach(function(r){
                r.mayGrant.forEach(function(gr){
                    maySee.push(gr._id);
                })
            });

            // Compile AND filters
            if (!mongoose.Types.ObjectId.isValid(req.body.searchFilters.role)) andFilters.push({roles: {$in: maySee}});
            else andFilters.push({'roles': req.body.searchFilters.role});

            if (mongoose.Types.ObjectId.isValid(req.body.searchFilters.branch)) andFilters.push({'branch': req.body.searchFilters.branch});
            if (mongoose.Types.ObjectId.isValid(req.body.searchFilters.group)) andFilters.push({'groups': req.body.searchFilters.group});
            if (mongoose.Types.ObjectId.isValid(req.body.searchFilters.house)) andFilters.push({'student.house': req.body.searchFilters.house});
            if (mongoose.Types.ObjectId.isValid(req.body.searchFilters.customer)) andFilters.push({'customer': req.body.searchFilters.customer});

            if (andFilters.length > 0) {

                var pagOptions = {
                    page: req.body.page || 1,
                    limit: req.body.limit || 10,
                    columns: 'doc firstName lastName email phoneNumber avatarURL roles groups student',
                    populate: 'roles groups student.house',
                    lean: true
                };

                andFilters.push({$or:orFilters});

                User.paginate({$and: andFilters }, pagOptions)
                    .then( function (results){
                        res.status(200).json(results);
                    })
                    .catch(function (err) { errorHandler.handleError(err, req, res)});
            }

            else {

                var pagOptions = {
                    page: req.body.page || 1,
                    limit: req.body.limit || 10,
                    columns: 'doc firstName lastName email phoneNumber avatarURL roles groupsBelonging groupsOwned',
                    populate: 'roles groupsBelonging groupsOwned',
                    lean: true
                };

                User.paginate({$or: orFilters }, pagOptions)
                    .then( function (results){
                        res.status(200).json(results);
                    })
                    .catch(function (err) { errorHandler.handleError(err, req, res)});
            }
        },


        lazyLoad: function(req, res) {

            if (typeof req.query.limit == 'undefined') req.query.limit = 6;
            if (typeof req.query.fromIndex == 'undefined') req.query.fromIndex = 0;
            if (typeof req.query.roles == 'undefined') req.query.roles = 'branch-admin,teacher,parent,student';

            var limit = req.query.limit;
            var fromIndex = req.query.fromIndex;
            var roles = req.query.roles.split(',');


            var andFilters = [];
            var aggregatePipeline = [];

            if (typeof req.query.like != "undefined") {
                var reTerm = req.query.like;
                var terms = reTerm.split(" ");

                if (terms.length > 1) {
                    reTerm = terms[0];
                    for (var i = 1; i < terms.length; i++ ) {
                        reTerm = reTerm + "|" + terms[i]  ;
                    }
                }
                //var re = new RegExp(req.query.searchField, "i"); // i = case insensitive
                var re = new RegExp(reTerm, "i"); // i = case insensitive
                andFilters.push({$or:[{ firstName: { $regex: re }}, { lastName: { $regex: re }}, { doc: { $regex: re }}]});
            }

            if (mongoose.Types.ObjectId.isValid(req.query.customer)) andFilters.push({'customer': mongoose.Types.ObjectId(req.query.customer)});
            if (mongoose.Types.ObjectId.isValid(req.query.branch)) andFilters.push({'branch': mongoose.Types.ObjectId(req.query.branch)});

            Role.find({name: {$in: roles}})
                .then(function(roles){

                    var ids = roles.map(function(r){ return r._id });

                    andFilters.push({roles: {$elemMatch: {$in: ids}}});

                    aggregatePipeline.push({ $sort:  {lastName: -1}});
                    aggregatePipeline.push({ $match: {$and:andFilters}} );
                    aggregatePipeline.push({ $skip:  fromIndex});
                    aggregatePipeline.push({ $limit: limit});

                    User.aggregate( aggregatePipeline ,function(err, result){
                        if (err) errorHandler.handleError(err, req, res);
                        console.log(result);
                        res.status(200).json(result);
                    });

                })
        }
    };

    /**
     * Roles handling Functions
     * @type {{add: Function, remove: Function}}
     */
    module.exports.role = {

        /**
         * Adds a role.
         * @param req
         * @param res
         */
        add: function(req, res) {
            User.findOne ({_id: req.params.id})
                .populate('roles')
                .then(
                    function (user) {

                        if (!user) {
                            throw new customErr.notFoundError("User not found");
                        }

                        if (user.hasRole(req.body.name)) {
                            logger.info("User already has that role");
                            res.status(200).send(messages.info.duplicate("Role"));
                            return;
                        }

                        return user.addRole(req.body.name);
                })
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        /**
         * Removes a role
         * @param req
         * @param res
         */
        remove: function (req, res) {

            User.findOne({_id: req.params.id})
                .populate('roles')
                .then (function (user) { return user.delRole(req.body.name);})
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});

        }
    }

    /**
     * Children handling Functions
     * @type {{add: Function, remove: Function}}
     */
    module.exports.children = {

        /**
         * Returns all children of the given user
         * @param req
         * @param res
         */
        all: function(req, res){
            User.findOne( {doc:req.params.doc},'parent.children')
                .populate('parent.children', 'firstName lastName')
                .then( function (user) { res.status(200).json(user.parent.children); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        /**
         * Adds a Children - Must have parent roles
         * @param req
         * @param res
         */
        add: function(req, res) {

            function appendChildren(user, children) {

                return new Promise (function (resolve, reject) {

                    // Map to get only the documents of the json recieved.
                    var docsToAdd = children.map(function (c) {return c.doc});
                    User.find({doc: {$in: docsToAdd }}, '_id').then(

                        function (result) {

                            if (_.isEmpty(result)) {

                                var e = new customErr.mildError(
                                    "Received children not found",
                                    mesages.data.dontExist("One or more children"), 404);

                                reject(e);

                            } else {
                                // Map to get only the ids of the documents returned
                                var idsToAdd = result.map(function (c) {return c._id});

                                // Complement of old with new to only push new ones
                                // idsToAdd minus the ones already in the parent
                                var newOnes = _.difference(idsToAdd, user.parent.children);

                                // If there isn any new, reject
                                if (newOnes.length == 0) {

                                    var e = new customErr.mildError(
                                        "All students received are already mapped to this parent",
                                        messages.data.duplicate("Children sent"), 400);

                                    reject(e);
                                }

                                user.parent.children = user.parent.children.concat(newOnes);
                                resolve(user);
                            }
                        }
                    );

                });
            }

            User.findOne({_id: req.params.id})
                .populate ('roles')
                .then (function (user) { return authMid.userHasRoles(user, ['parent']); })
                .then (function (user) { return appendChildren( user, req.body); })
                .then (function (user) { user.save() })
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        /**
         * Removes a Children - Must have parent roles
         * @param req
         * @param res
         */
        remove: function(req, res) {

            User.findOne({_id: req.params.id})
                .populate ('roles parent.children')
                .then (function (user) { return authMid.userHasRoles(user, ['parent']); })
                .then (function (user) { return user.delChild(req.body.doc); })
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }

    };

    /**
     * Character Handling Functions
     * @type {{addXP: Function, delXP: Function, get: Function, create: Function, update: Function}}
     */
    module.exports.character = {

        /**
         * Returns User Character - Appends Level Information
         * @param req
         * @param res
         */
        get: function (req, res) {
            User.findOne( {_id: req.params.id})
                .populate('student.character.traits.body.head')
                .populate('student.character.traits.body.upperBody')
                .populate('student.character.traits.body.lowerBody')
                .populate('student.character.traits.body.eyes')
                .populate('student.character.traits.body.eyebrows')
                .populate('student.character.traits.body.mouth')
                .populate('student.character.traits.body.hair')
                .populate('student.character.traits.body.facialHair')
                .populate('student.character.traits.body.colour')
                .populate('student.character.traits.wearables.eyes')
                .populate('student.character.traits.wearables.head')
                .populate('student.character.traits.wearables.chest')
                .populate('student.character.traits.wearables.legs')
                .populate('student.character.traits.wearables.leftHand')
                .populate('student.character.traits.wearables.rightHand')
                .populate('student.character.traits.wearables.feet')
                .populate('student.character.traits.wearables.companionLeft')
                .populate('student.character.traits.wearables.companionRight')
                .populate('student.character.traits.background')
                .populate('student.character.traits.companion')

                .then(function (user){
                    res.status(200).json(user.student.character);
                })
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        },

        /**
         * Updates a character (All of it)
         * The new character record must be contained in the body
         * @param req
         * @param res
         */
        update: function (req, res) {
            User.findOneAndUpdate( {_id: req.params.id}, {"student.character": req.body}, {upsert:false})
                .then( function (result){ res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        }
    };

    /**
     * House handling Functions
     * @type {{update: Function}}
     */
    module.exports.house = {
        /**
         * Updates a user house. Body must have house id
         * @param req
         * @param res
         */
        update: function (req, res) {
            User.findOne( {_id: req.params.id})
                .then ( function (user) {
                user.student.house = req.body.id || user.student.house;
                return user.save();
            })
                .then( function (result){ res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        }
    };

    /**
     * Activity Handling Functions
     * @type {{all: Function, query: Function}}
     */
    module.exports.activity = {


        /**
         * @apiDefine userActivitySuccess
         * @apiSuccess {string} activity _id.
         * @apiSuccess {date} timestamp.
         */

        /**
         * @api {get} /user/:id/activities
         * @apiName GetUserActivities
         * @apiVersion 2.0.0
         * @apiParam {String} [id] Id of the User.
         * @apiDescription
         * Find a username by document. Returns hes activity
         * Can be passed a query to limit results. Query receives limit. e.g. ?limit=3
         * If limit is received the result is limited to last x activities where x is limit.
         *
         * @apiUse userActivitySuccess
         */
        find: function (req, res) {
            User.findOne( {_id: req.params.id} )
                .deepPopulate("student.character.activities.activity.skills")
                .lean(true)
                .then(function (result){
                        var _activities = result.student.character.activities;

                        if (typeof req.query.limit != 'undefined' && _activities.length > 0) {
                            //Limit activities
                            _activities = _.sortBy(_activities, 'timestamp').reverse();
                            _activities.splice(req.query.limit);
                        }
                        res.status(200).json( _activities );
                })
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        },


        /**
         * @api {post} /user/:id/activities
         * @apiName AddUserActivities
         * @apiVersion 2.0.0
         * @apiParam {String} [id] Id of the User.
         * @apiParam {String} [_id] Id of the Activity (body).
         * @apiDescription
         * Find a username by document. Adds received activity
         *
         * @apiUse userActivitySuccess
         */
        add: function (req, res) {

            var _user;
            var _activity;

            User.findOne( {_id: req.params.id} )
                .populate('student.character.statusEffects.statusEffect')
                .then(function (user){
                    user.student.character.activities.push({activity: req.body._id});
                    return user.save();
                })
                .then(function (user){
                    _user = user;
                    //Retrieve the activity...
                    return Activity.findOne({_id: req.body._id}).lean(true);
                })
                .then(function(activity) {
                    _activity = activity;
                    //Apply Activty Reward
                    //_user.student.character.xp += _activity.reward.xp;
                    //_user.student.character.money += _activity.reward.money;

                    _user.applyReward(_activity.reward, _activity.skills);

                    //Get house xp awarded for this activity. This is is made here
                    //so that there is only one db query to find out that. Otherwise eventController and
                    //house controller would query db for that info. Adding overload and elevating the risk of getting
                    //different information each time.
                    return houseController.getXPAward(_user, _activity.reward.xp)
                })
                .then(function(houseXp){

                    _activity.houseXp = houseXp;
                    _activity.giver = req.user.id;

                    // I am not saving the user...next step
                    // (one of the functions suscribed to the event)
                    // will save.
                    eh.emit('activitycompleted', _user, _activity);
                    res.status(200).json(_user);

                })
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        }
    };

    module.exports.quests = {
        /**
         * Return user active quests.
         * @param req
         * @param res
         */
        all: function(req, res){
            User.findOne({_id: req.params.id})
                .sort("-assigned")
                .populate('student.character.quests.quest')
                .deepPopulate('student.character.quests.goals.goal.skill')
                .then( function (user){
                    res.status(200).json(user.student.character.activeQuests);
                })
                .catch(function (err) { errorHandler.handleError(err, req, res) })
        }
    };

    module.exports.traits = {

        all: function(req, res) {
            User.findOne({_id: req.params.id})
                .populate('student.character.traits')
                .then( function(user) {
                    res.status(200).json(user.student.character.traits);
                })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        inventory: function(req, res) {
            User.findOne({_id: req.params.id})
                .populate('student.character.inventory')
                .then( function(user) {
                    res.status(200).json(user.student.character.inventory);
                })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        buy: function(req, res) {

            var _user;
            var _trait;
            User.findOne({_id: req.params.id})
                .then( function(user){
                    _user = user;
                    return Trait.findOne({_id: req.body.traitId});
                })
                .then( function (trait){

                    _trait = trait;
                    // The user _user has bought the trait _trait

                    // Check if user don't have it already
                    var index = _user.student.character.inventory.indexOf(_trait._id);
                    if (index != -1) throw new customErr.traitAlreadyOwned();

                    // Check if user has enough money for the transaction
                    if (_user.student.character.money < _trait.price) throw new customErr.notEnoughMoney();

                    // Decrement money available.
                    _user.student.character.money -= _trait.price;

                    // Add trait to inventory.
                    _user.student.character.inventory.push(_trait._id);

                    return _user.save();
                })
                .then(function(result){
                    eh.emit("traitacquired", _user, _trait);

                    //Send Result
                    var _resObj = {
                        status:200,
                        message: "Purchase has been successfully completed",
                        currency: _user.student.character.money,
                        inventory: _user.student.character.inventory
                    };

                    res.status(200).json(_resObj);

                })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }

    };

    module.exports.parent = {

        new: function (req, res) {
            if (!(req.body) || !(req.body.credentials) || !(req.body.credentials.username) || !(req.body.credentials.password)) {
                res.status(400).send(messages.data.missingOrIncomplete("Credentials"));
                return;
            }

            if (!(req.body.doc)) {
                res.status(400).send(messages.data.missingOrIncomplete("Document"));
                return;
            }

            var _kidsCustomer;
            var parent_user_doc = req.body.doc;
            User.findOne({$or: [{'student.parent.doc': parent_user_doc}, {'student.parent2.doc': parent_user_doc}]})
                .select('customer branches')
                .then(function(result){
                    _kidsCustomer = result;

                    if (_.isEmpty(result)) {
                        var e = new customErr.notFoundError('No hay ningún estudiante asociado a este documento.', '', 401);
                        throw e;
                    }

                    else return utils.hashPasswordAsync(req.body.credentials.password);
                })
                .then(function (hash) {
                    req.body.credentials.password = hash;
                    var newUser = new User(req.body);
                    newUser.roles = [];
                    newUser.addRole('parent');
                    newUser.customer = _kidsCustomer.customer;
                    newUser.branches = _kidsCustomer.branches;
                    return newUser.save();
                })
                .then(function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res) });

        },

        findChildren: function(req, res){
            var parent_user_doc = req.params.doc;
            User.find({$or: [{'student.parent.doc': parent_user_doc}, {'student.parent2.doc': parent_user_doc}]})
                .select('-credentials')
                .then(function(children){ res.status(200).send(children);})
                .catch(function(err){ errorHandler.handleError(err, req, res);})
        }

    }

    module.exports.specialEvents = {
        complete: function(req, res) {
            var eventId = req.params.eventId;
            var grade = req.body.grade;


            User.findOne( {_id: req.params.id} )
                .then(function(user){
                    return user.completeSpecialEvent(eventId, grade);
                })
                .then(function(result){
                    res.status(200).json(result);
                })
                .catch(function(err){ errorHandler.handleError(err, req, res);})
        }
    }

    module.exports.openChest = function (req, res) {
        var _user = {};
        User.findOne({_id: req.params.id})
            .then(function(user){
                _user = user;
                return _user.openChest(req.params.chestId);
            })
            .then(function(_data){
                res.status(200).json(_data);
            })
            .catch(function(err){ errorHandler.handleError(err, req, res);})
    }

    module.exports.lookForNewQuests = function(userId){

        if (config.quests.respawnTime == 0) return;

        var _user;

        User.findOne({_id: userId})
            .populate('roles')
            .then( function (user) {
                if (!user) return;

                _user = user;

                var studentRole = _.find(user.roles, {name:"student"});
                if (_.isEmpty(studentRole)) return; //It is not student, do not add quest.

                if (config.quests.respawnTime != -1)
                    if (user.student.character.lastQuestAssignment != null){
                        //has quest assigned already, lets check the date
                        var nextQuestDate = user.student.character.lastQuestAssignment.add({days: config.quests.respawnTime});
                        if (Date.now() < nextQuestDate || user.student.character.activeQuests.length >= 3) {
                            //Cant assign new quest yet
                            return;
                        }
                    }

                //NEW QUEST AVAILABLE
                Quest.find({customer: user.customer})
                    .populate('goals')
                    .then(function(quests){

                        var questIdList = quests.map(function(q){return q._id.toString();}); //Just Ids to match the user data

                        var userQuests = _user.student.character.activeQuests.forEach(function(q){
                            return q.quest.toString();
                        });

                        var assignableQuests = _.difference(questIdList, userQuests); //Get the ones that the user isn't assigned yet
                        var newQuestId = _.sample(assignableQuests); //Choose 1 random...but i only have the Id

                        var newQuest = _.find( quests, function(q){ return q._id.toString() == newQuestId.toString(); }); //Get an object with that id.

                        //Assign it to the user
                        _user.addQuest(newQuest)
                            .then(function(_user){
                                //Emit the event with the actual userQuest.
                                eh.emit('newquestavailable', user, newQuest);
                            })

                    })
                    .catch(function(err) {
                        errorHandler.handleError(err);
                    })
            })

    };

    module.exports.checkForIncomingBirthdays = function(){

        var consoleInfo = '[classbuzz] Starting birthday process @ ' + moment().format();
        console.log(consoleInfo.cyan);

        var promises = [];

        var reference = moment();
        var today = reference.clone().startOf('day');
        var tomorrow = today.clone().add(1, 'days');

        return Role.findOne({name: 'student'})
            .then (function(role){
                return User.find({roles: role});
            })
            .then (function(studentUsers){
                studentUsers.forEach(function(s){


                    var studentBirthday = moment(s.birthday).startOf('day');
                    var thisYearBday = studentBirthday.clone().year(today.year());
                    var nextYearBday = studentBirthday.clone().year(today.year()+1);

                    if (today.diff(thisYearBday,'days') == 0) eh.emit('happybirthday', s);

                    if (thisYearBday.isBetween(today, tomorrow, null, '[]') || nextYearBday.isBetween(today, tomorrow, null, '[]')) {

                        //Find teachers and emit birthday notification.
                        promises.push(User.findStudentTeachers(s._id)
                            .then(function(teachers){
                                teachers.forEach(function(t){
                                    if (_.isNil(t)) return;
                                    eh.emit('incomingbirthday', t, s);
                                })
                            }))
                    }

                });

                return Promise.all(promises);

            })
            .catch(function(err){
                errorHandler.handleError(err);
            });
    };

    module.exports.getUsername = function(req, res) {
        User.findOne({_id:req.params.id})
            .then(function(user){
                if (user != null) res.status(200).json(user.credentials.username);
                else throw new customErr.notFoundError('User Not Found', 'User Not Found', 404);
            })
            .catch(function (err) { errorHandler.handleError(err, req, res) });
    };

    module.exports.updatePassword = function(req, res) {
        utils.hashPasswordAsync(req.body.password)
            .then(function(hash) {
                return User.findOneAndUpdate({doc:req.user.doc},{"credentials.password":hash});
            })
            .then( function (result){ res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res) });
    };

    module.exports.resetPassword = function(req, res) {
        utils.hashPasswordAsync(req.body.password)
            .then(function(hash) {
                return User.findOneAndUpdate({_id:req.params.id},{"credentials.password":hash});
            })
            .then( function (result){ res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res) });
    };

    module.exports.resetUsername = function(req, res) {
        User.findOneAndUpdate({_id:req.params.id},{"credentials.username":req.body.username})
            .then( function (result){ res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res) });
    };

    module.exports.registerConnectionActivity = function (userId) {
        User.findOne({_id:userId})
            .then(function(user){
                if (user) user.registerConnection();
            })
    };

    module.exports.parentUpdateMailingProcess = statusMailsController.triggerNewStatusMailProcess;

    module.exports.studentSpecificParentNewsletter = function(req, res){
        User.findOne({_id:req.body.id})
            .populate('customer branches student.character.activities.activity')
            .then(function(st){

                if (typeof req.body.fromDate == 'undefined') req.body.fromDate = null;
                if (typeof req.body.toDate == 'undefined') req.body.toDate = null;

                statusMailsController.createStudentStatusMail(st, null, true, req.body.fromDate, req.body.toDate);
                res.status(200).send("Newsletter process started!");
            })
            .catch( function(err){ errorHandler.handleError(err, req, res); })
    };

    module.exports.parentNewsletter = function(req, res){
        statusMailsController.triggerNewStatusMailProcess()
            .then( function(result) { res.status(200).send("Newsletter process completed OK!"); })
            .catch( function(err){ errorHandler.handleError(err, req, res); })
    };

    eh.on('activitycompleted', function(user, activity) {
        recalculateGoalsSteps(user, activity);
    });

    eh.on('happybirthday', function(user) {

        user.addStatusEffect('normal','buff', ['goldGained', 'xpGained'], 10 * 24)
            .catch(function(err){
                console.log(err);
                errorHandler.handleError(err);
            })
    });

    /**
     * Given an activity, checks which goals it affects. And then compares that goals to the users current goals.
     * If ther is a match, increments the current steps for each matching goal.
     * Checks is goal is fulfilled and emits 'goalcompleted' event.
     * Checks if quest is completed  and emits 'questcompleted' event.
     * @param user
     * @param activity
     */
    function recalculateGoalsSteps(user, activity){

        //Populate in case quest.goals.goal is un populated...
        return User
            .populate(user, { path:'student.character.quests.goals.goal student.character.quests.quest student.character.statusEffects.statusEffect'})
            .then(function(_user){

                //For Each Quest
                _user.student.character.activeQuests.forEach(function(q){

                    //For Each QuestGoal
                    q.goals.forEach(function(g){

                        //If goal is already fulfilled then return...
                        if (g.isFulfilled) return;

                        //If goal matches with activity increment completed steps
                        if (g.goal.matchesActivity(activity)) g.completedSteps += 1;

                        //If is fulfilled, emit event
                        if (g.isFulfilled) eh.emit('goalcompleted', _user, g.goal);

                    });

                    if (q.isCompleted)  {
                        //Quest Completed

                        //Set Completed Date
                        q.completed = new Date();

                        //Apply Rewards;
                        _user.applyReward(q.quest.reward);

                        //Get house xp awarded for this quest. This is is made here
                        //so that there is only one db query to find out that. Otherwise eventController and
                        //house controller would query db for that info. Adding overload and elevating the risk of getting
                        //different information each time.
                        houseController.getXPAward(_user, q.quest.reward.xp)
                            .then(function(houseXp){

                                q.quest.houseXp = houseXp;

                                //Emit Event
                                eh.emit('questcompleted', _user, q.quest);
                            })

                    }

                });

                return _user.save();
            });
    }

}).call(this);