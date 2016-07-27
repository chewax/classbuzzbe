(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var Role = require('../roles/roleModel');
    var Achievement = require('../achievements/achievementModel');
    var Quest = require('../quests/questModel');
    var utils = require('../core/utils');
    var logger = require('../log/logger').getLogger();
    var deepPopulate = require('mongoose-deep-populate')(mongoose);
    var mongoosePaginate = require('mongoose-paginate');
    var bcrypt = require('bcrypt');
    var _ = require('underscore');
    require('datejs');

    var userActivity = new mongoose.Schema({
        action: {type: "String", default: "login"},
        timestamp: {type: Date, default: Date.now},
        description: "String"
    });

    var userSchema = new mongoose.Schema({
            // GLOBAL
            doc: {type: String, unique: true},
            firstName: {type:String, index: true},
            lastName: {type:String, index: true},
            email: String,
            phoneNumber: String,
            gender: String,

            avatarURL: {type: String, default: null},
            signUpDate: {type:Date, default: new Date()},

            resetPasswordToken: String,
            resetPasswordExpires: Date,

            isActive: {type: Boolean, default: true, index:true},
            activity: [userActivity],

            lastConnection: {type:Date, default: new Date().last().year().clearTime()},
            connectionStreakDays: {type:Number, default: 0},

            address: {
                street: String,
                number: String,
                city: String,
                state: String,
                zip: String
            },

            credentials: {
                username: {type: String, unique: true},
                password: String
            },

            roles: [{type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null, index:true}],

            // TEACHER/STUDENT
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null, index:true},
            branches: [{type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: []}],
            subBranches: [{type: mongoose.Schema.Types.ObjectId, ref: 'SubBranch', default: []}],
            groups: [{type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: []}],

            // PARENT ONLY
            parent: {
                children: [{type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true}]
            },

            // STUDENT ONLY
            student: {

                parentalControl: {
                    dailyHours: {type: Number, default: 5},
                    notificationSchedule: {type: String, default: 'weekly'},
                },

                parent: {
                    doc: {type: String, default: null},
                    firstName: {type: String, default: ""},
                    lastName: {type: String, default: ""},
                    phoneNumber: {type: String, default: ""},
                    email: {type: String, default: ""},
                    contactDetails: {type: String, default: ""}
                },

                parent2: {
                    doc: {type: String, default: null},
                    firstName: {type: String, default: ""},
                    lastName: {type: String, default: ""},
                    phoneNumber: {type: String, default: ""},
                    email: {type: String, default: ""},
                    contactDetails: {type: String, default: ""}
                },

                lastQuestAssignment: {type: Date, default:null},

                quests: [{type: mongoose.Schema.Types.ObjectId, ref: 'Quest', default: []}],

                house: {type: mongoose.Schema.Types.ObjectId, ref: 'House', default: null},

                character: {

                    inventory: [{type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null}],

                    traits: {
                        body: {
                            head: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                            upperBody: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                            lowerBody: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                            eyes: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                            mouth: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                            hair: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                            facialHair: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                            colour: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                            eyebrows: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null}
                        },

                        wearables: {
                            eyes: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                            head: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                            chest: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                            legs: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                            leftHand: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                            rightHand: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                            feet: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                            companionRight: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                            companionLeft: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null}
                        },

                        background: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                    },


                    xp: {type: Number, default: 0},

                    achievements: [{
                        achievement: {type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', default: null},
                        timestamp: {type:Date, default: new Date()}
                    }],

                    events: [{type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null}]
                },

                currency: {
                    doubloons: {type: Number, default: 0}
                }
            }

        },

        {
            collection: 'Users'
        }
    );

    userSchema.pre('save',function(next){
        var self = this;
        self.firstName = self.firstName.capitalize();
        self.lastName = self.lastName.capitalize();
        self.doc = self.doc.removeChar('.');
        self.doc = self.doc.removeChar('-');
        next();
    })

    /**
     * Find a user given the username
     * @param username
     * @param callback
     * @returns {Query|*}
     */
    userSchema.statics.findByUsername = function (username, callback) {
        return this.findOne({"credentials.username": username}, callback);
    }

    userSchema.statics.findStudentTeachers = function(studentDoc) {
        var _role, _student;

        return Role.findOne({name:"teacher"})
            .then(function(role){
                _role = role;
                return User.findOne({doc:studentDoc});
            })
            .then(function(student){
                _student = student;
                return User.find({ $and: [
                    {roles: [_role._id]},
                    {groups: {$in: _student.groups}}
                ]})
                    .select('firstName lastName email doc')
            })
    }

    /**
     * Gets user given the document
     * @param userDocument
     * @param callback
     * @returns {Query|*}
     */
    userSchema.statics.getId = function (userDocument, callback) {
        return this.findOne({doc: child.doc}, 'id', callback);
    }

    /**
     * Removes a user given the document
     * @param userDocument
     * @param callback
     * @returns {Query|*}
     */
    userSchema.statics.removeByDocument = function (userDocument, callback) {
        return this.findOneAndRemove({doc: userDocument}, callback);
    }

    /**
     * Checks if a record for the given userDocument exists
     * @param userDocument
     */
    userSchema.statics.exists = function (userDocument) {
        this.find({doc: userDocument}, 'id', function (err, results) {
            if (results == []) return false;
            else return true;
        });
    }

    /**
     * Upserts given user
     * @param userObject
     * @param callback
     * @returns {Query|*}
     */
    userSchema.statics.upsert = function (userObject, callback) {
        return this.findOneAndUpdate({doc: userObject.doc}, userObject, {upsert: true}, callback);
    }

    /**
     * Adds a character to the given userDocument user.
     * @param userDocument
     * @param characterObject
     * @param callback
     * @returns {Query|*}
     */
    userSchema.statics.addCharacterByDocument = function (userDocument, characterObject, callback) {
        return this.findOneAndUpdate({doc: userDocument}, {character: characterObject}, {upsert: false}, callback);
    }

    userSchema.statics.addQuest = function (userDoc, questId) {
        this.findOne({doc: userDoc})
            .then(function (user) {
                user.student.quests.push(questId);
                user.student.lastQuestAssignment = new Date().clearTime();
                return user.save();
            })
    };

    userSchema.statics.removeQuest = function (userDoc, questId) {
        this.findOne({doc: userDoc})
            .then(function (user) {
                user.student.quests.pop(questId);
                return user.save();
            })
    };

    userSchema.methods.addQuest = function (quest) {
        this.student.quests.push(quest._id);
        this.student.lastQuestAssignment = new Date().clearTime();
        return this.save();
    };

    /**
     * Adds new login activity record to the given user.
     * @param description
     * @param callback
     */
    userSchema.methods.login = function (description, callback) {

        var newActivity = {
            action: "login",
            timestamp: Date.now(),
            description: description
        };

        this.activity.push(newActivity);
        this.save(callback);
    }

    /**
     * Adds new connection activity record to the given user.
     * @param description
     * @param callback
     */
    userSchema.methods.registerConnection = function () {

        //Lets see if it has passed more than one day but less than two.
        //Streak is lost if one day is missing from connection.
        var lastConnection = new Date(this.lastConnection);
        var nextDayBegins = new Date(lastConnection.add({days:1})).clearTime();
        var nextDayEnds = new Date(lastConnection.add({minutes:1439}));

        if (Date.now() < nextDayBegins) {
            //Same day Returning
            return;
        }

        if (Date.now() > nextDayEnds) {
            //Streak Lost.

            if (this.connectionStreakDays > 0 ){
                // The streak that he had is lost.
                // TODO Maybe raise an event??
            }
            this.connectionStreakDays = 0;
            this.lastConnection = new Date().clearTime();
            return this.save();
        }


        //If reaches here --> new day steak
        this.connectionStreakDays += 1;
        this.lastConnection = new Date().clearTime();
        return this.save();
    }

    /**
     * Adds new logout activity record to the given user.rs
     * @param description
     * @param callback
     */
    userSchema.methods.logout = function (description, callback) {

        var newActivity = {
            action: "logout",
            timestamp: Date.now(),
            description: description
        };

        this.activity.push(newActivity);
        this.save(callback);
    }

    /**
     * Checks if user has the given role looking for the role name. roles must have been populated
     * @param roleName
     * @returns {boolean}
     */
    userSchema.methods.hasRole = function (roleName) {
        var userRoles = this.roles.map(function (r) {
            return r.name
        });

        var index = userRoles.indexOf(roleName);
        if (index == -1) return false;
        else return true;
    }

    /**
     * Adds a role from a user object given the role name
     * @param roleName
     */
    userSchema.methods.addRole = function (roleName) {
        Role.findOne({name: roleName}, (function (err, results) {
            var role = results;
            this.roles.push(role);
            return this.save();

        }).bind(this));
    }

    /**
     * Deletes a role from a user object. roles must have been populated
     * @param roleName
     * @returns {Promise|*}
     */
    userSchema.methods.delRole = function (roleName) {

        var userRoles = this.roles.map(function (r) {
            return r.name;
        });
        var index = userRoles.indexOf(roleName);

        if (index != -1) {
            this.roles.splice(index, 1);
        }

        return this.save();
    }

    /**
     * Deletes a child from a user object. parent.children must have been populated
     * @param childDocument
     * @returns {Promise|*}
     */
    userSchema.methods.delChild = function (childDocument) {

        var userChild = this.parent.children.map(function (c) {
            return c.doc;
        });
        var index = userChild.indexOf(childDocument);

        if (index != -1) {
            this.parent.children.splice(index, 1);
        }

        return this.save();
    };

    /**
     * Adds achievement to user Given the ID. Performs the xp ingrease, decrease.
     * @param achievementId
     * @returns {*}
     */
    userSchema.methods.addAchievement = function (achievement) {

        this.student.character.achievements.push({achievement: achievement._id, timestamp: new Date()});
        this.student.character.xp += (achievement.xpAward);
        if (this.student.character.xp < 0) this.student.character.xp = 0;
        return this.save();

    };

    /**
     * Adds achievement to user Given the ID. Performs the xp ingrease, decrease.
     * @param achievementId
     * @returns {*}
     */
    userSchema.methods.removeAchievement = function (achievementId) {

        return Achievement.findOne({achievement: achievementId})
            .then(function (achievement) {
            var index = _.findIndex(this.student.character.achievements,{achievement:achievementId});
            //var index = this.student.character.achievements.indexOf(achievementId);
            if (index != -1) {
                this.student.character.xp -= achievement.xpAward;
                this.student.character.achievements.splice(index, 1);
            }
            return this.save();
        }.bind(this));

    };

    var options = {
        populate: {
            'groups': {select: 'name students customer branch level customClass'},
            'groups.level': {select: '_id code name'},
            'groups.students': {select: 'doc firstName lastName student.parent student.parent2'},
            'branches': {select: 'name'},
            'branches.headmaster': {select: 'firstName lastName'},
            'roles': {select: 'name mayGrant'},
            'roles.mayGrant': {select: 'name'},
            'parent.children': {select: 'firstName lastName'},
            'student.quests': {select: 'name reward trigger customer'},
            'student.quests.trigger.achievement': {select: 'avatarURL name'}
        }
    };

    userSchema.plugin(deepPopulate, options);
    userSchema.plugin(mongoosePaginate);

    var User = mongoose.model('User', userSchema);

    module.exports = User;

}).call(this);