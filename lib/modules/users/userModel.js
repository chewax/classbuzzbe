(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var Role = require('../roles/roleModel');
    var activity = require('../activities/activityModel');
    var Quest = require('../quests/questModel');
    var utils = require('../core/utils');
    var logger = require('../log/logger').getLogger();
    var deepPopulate = require('mongoose-deep-populate')(mongoose);
    var mongoosePaginate = require('mongoose-paginate');
    var eventEmitter = require('../core/eventsHandler');
    var bcrypt = require('bcrypt');
    var _ = require('lodash');
    require('datejs');


    /**
     * Character Trait Schema
     * Will store the users character's currently equipped items information
     */
    var characterTraits = new mongoose.Schema({
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
    });


    /**
     * User Parent Schema
     * Will store the users' parent information...parents may or may not have a user...thats why.
     */
    var userParent = new mongoose.Schema({
        doc: {type: String, default: null},
        firstName: {type: String, default: ""},
        lastName: {type: String, default: ""},
        phoneNumber: {type: String, default: ""},
        email: {type: String, default: ""},
        contactDetails: {type: String, default: ""}
    });


    /**
     * User Address Schema
     * Will store the users' address.
     */
    var userAddress = new mongoose.Schema({
        street: {type: String},
        number: {type: String},
        city: {type: String},
        state: {type: String},
        zip: {type: String},
        country: {type: String}
    });

    /**
     * User Locale Schema
     * Will store the users' locale info.
     */
    var userLocale = new mongoose.Schema({
        code: {type: String},
        timezone: {type: String}
    });

    /**
     * User Credentials Schema
     * Will store the users' locale info.
     */
    var userCredentials = new mongoose.Schema({
            username: {type: String, unique: true},
            password: {type: String}
    });


    var questGoal = new mongoose.Schema({
            goal: {type: mongoose.Schema.Types.ObjectId, ref: 'QuestGoal', default: []},
            completedSteps: {type: Number, default: 0}
    });


    /**
     * Character Schema
     * Will store the users' character information
     */
    var userCharacter = new mongoose.Schema({
        inventory: [{type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null}],

        isAlive: {type:Boolean, default: true},

        traits: characterTraits,

        xp: {type: Number, default: 0},
        money: {type: Number, default: 0},

        activities: [{
            activity: {type: mongoose.Schema.Types.ObjectId, ref: 'Activity', default: null},
            timestamp: {type:Date, default: new Date()}
        }],

        skills: [{
            skill: {type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default: null},
            rank: {type: mongoose.Schema.Types.ObjectId, ref: 'Rank', default: null}
        }],

        quests: [{
            quest: {type: mongoose.Schema.Types.ObjectId, ref: 'Quest', default: []},
            assigned: {type: Date, default: new Date() },
            completed: {type: Date, default: null},
            goals: [questGoal]
        }],

        events: [{type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null}]
    });

    /**
     * Virtual Attribute to calculate lastConnection.
     * Name: lastQuestAssignment.
     */
    userCharacter.virtual('lastQuestAssignment').get(function(){

        var sortedQuests = _.sortBy(this.quests, function(q) {
            if (typeof q != "undefined") return q.assigned;
            else return null;
        }).reverse();

        if (typeof sortedQuests[0] != "undefined") return sortedQuests[0].assigned;
        else return null;
    });


    /**
     * Virtual Attribute to get active quests
     * Name: activeQuests.
     */
    userCharacter.virtual('activeQuests').get(function(){
        var activeQuests = _.filter(this.quests, function(q){
            return q.completed == null;
        })

        return activeQuests;
    });

    /**
     * Virtual Attribute to get completed quests
     * Name: completedQuests.
     */
    userCharacter.virtual('completedQuests').get(function(){
        var completedQuests = _.filter(this.quests, function(q){
            return q.completed != null;
        })

        return completedQuests;
    });

    /**
     * Virtual Attribute to calculate LevelInfo.
     * Name: levelInfo.
     */
    userCharacter.virtual('levelInfo').get(function(){
        var xp = this.xp;
        var k = 0.2;
        var L = Math.floor(Math.sqrt(xp) * k);
        var XPPrev =  Math.round(Math.pow((L-1)/k, 2));
        var XPNext =  Math.round(Math.pow((L+1)/k, 2));
        var XPCurr =  Math.round(Math.pow((L)/k, 2));

        return {
            xp: xp,
            level: L+1,
            xpToPrevious: XPPrev,
            xpToCurrent: XPCurr,
            xpToNext: XPNext
        }
    });

    userCharacter.set('toObject', { virtuals: true });
    userCharacter.set('toJSON', { virtuals: true });

    var userSchema = new mongoose.Schema({

            doc:            {type: String, unique: true},
            firstName:      {type: String, index: true},
            lastName:       {type: String, index: true},
            email:          {type: String},
            phoneNumber:    {type: String},
            gender:         {type: String, enum: ["M", "F"]},
            avatarUrl:      {type: String, default: null},
            profilePicUrl:  {type: String, default: null},

            resetPasswordToken:     {type: String},
            resetPasswordExpires:   {type: Date},

            isActive: {type: Boolean, default: true, index:true},

            lastConnection: {type:Date, default: new Date().last().year().clearTime()},
            connectionStreakDays: {type:Number, default: 0},

            address:        userAddress,
            locale:         userLocale,
            credentials:    userCredentials,

            createdAt:  { type: Date, default: Date.now },
            updatedAt:  { type: Date, default: Date.now },

            roles:      [{type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null, index:true}],
            customer:   {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null, index:true},
            branch:     {type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: []},
            groups:     [{type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: []}],

            // PARENT ONLY
            parent: {
                children: [{type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true}]
            },

            // STUDENT ONLY
            student: {
                parents: [userParent],
                house: {type: mongoose.Schema.Types.ObjectId, ref: 'House', default: null},
                character: userCharacter,
                achievements: [{
                    achievement: {type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', default: null},
                    timestamp: {type: Date, default: Date.now}
                }],
                statProps: [{type: mongoose.Schema.Types.ObjectId, ref: 'StatProp', default: null}]
            }

        },
        { collection: 'Users' }
    );


    //For Virtual Fields
    userSchema.set('toObject', { virtuals: true });
    userSchema.set('toJSON', { virtuals: true });

    userSchema.pre('save',function(next){

        if (this.isNew && this.hasRole('student')) {
            //Create a character for him/her
            this.student.character = {};
        }

        //Change update timestamp
        this.updatedAt = Date.now();


        //Sanitize User Info
        this.firstName = this.firstName.capitalize();
        this.lastName = this.lastName.capitalize();
        this.doc = this.doc.removeChar('.');
        this.doc = this.doc.removeChar('-');

        next();
    });

    userSchema.pre('update', function() {
        this.update({}, { $set: { updatedAt: new Date() } });
    });



    /**
     * Find a student's teachers
     * @param studentDoc
     * @returns {Promise}
     */
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
    };

    /**
     * Adds Quest to user.
     * @param quest
     * @returns {*}
     */
    userSchema.methods.addQuest = function (quest) {

        var _newQuest = {
            quest: quest._id,
            goals: quest.goal
        };

        this.student.character.quests.push(_newQuest);
        return this.save();
    };


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
                eventEmitter.emit('streaklost', this);
            }

            this.connectionStreakDays = 0;
            this.lastConnection = new Date().clearTime();
            return this.save();
        }


        //If reaches here --> new day steak
        eventEmitter.emit('newstreakday', this);
        this.connectionStreakDays += 1;
        this.lastConnection = new Date().clearTime();
        return this.save();
    };

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
        var userRoles = this.roles.map(function (r) { return r.name;});
        var index = userRoles.indexOf(roleName);
        if (index != -1) this.roles.splice(index, 1);
        return this.save();
    }

    /**
     * Deletes a child from a user object. parent.children must have been populated
     * @param childDocument
     * @returns {Promise|*}
     */
    userSchema.methods.delChild = function (childDocument) {
        var userChild = this.parent.children.map(function (c) { return c.doc; });
        var index = userChild.indexOf(childDocument);
        if (index != -1) this.parent.children.splice(index, 1);
        return this.save();
    };

    /**
     * Adds activity to user Given the ID. Performs the xp ingrease, decrease.
     * @param activityId
     * @returns {*}
     */
    userSchema.methods.addActivity = function (activity) {
        //TODO Refactor

        this.student.character.activities.push({activity: activity._id, timestamp: new Date()});
        this.student.character.xp += (activity.xpAward);
        if (this.student.character.xp < 0) this.student.character.xp = 0;
        return this.save();

    };

    /**
     * Adds activity to user Given the ID. Performs the xp ingrease, decrease.
     * @param activityId
     * @returns {*}
     */
    userSchema.methods.removeActivity = function (activityId) {
        //TODO Refactor

        return activity.findOne({activity: activityId})
            .then(function (activity) {
            var index = _.findIndex(this.student.character.activities,{activity:activityId});
            if (index != -1) {
                this.student.character.xp -= activity.xpAward;
                this.student.character.activities.splice(index, 1);
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
            'student.quests': {select: 'name reward goals customer'},
            'student.quests.goals': {select: 'name type amount skill customer'},
            'student.quests.goals.skill': {select: 'name customer'}
        }
    };

    userSchema.plugin(deepPopulate, options);
    userSchema.plugin(mongoosePaginate);

    var User = mongoose.model('User', userSchema);

    module.exports = User;

}).call(this);