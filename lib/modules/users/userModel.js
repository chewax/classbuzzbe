(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var Role = require('../roles/roleModel');
    var activity = require('../activities/activityModel');
    var Rank = require('../ranks/rankModel');
    var logger = require('../log/logger').getLogger();
    var deepPopulate = require('mongoose-deep-populate')(mongoose);
    var mongoosePaginate = require('mongoose-paginate');
    var eh = require('../core/eventsHandler');
    var bcrypt = require('bcrypt');
    var _ = require('lodash');
    var config = require('../../config');
    require('datejs');

    var userAchievement = require('./schemas/userAchievement');
    var userCharacter = require('./schemas/userCharacter');
    var userParent = require('./schemas/userParent');
    var userLocale = require('./schemas/userLocale');
    var userAddress = require('./schemas/userAddress');
    var userCredentials = require('./schemas/userCredentials');


    /**
     * User Base Schema.
     * Uses all the other schema definitions
     */
    var userSchema = new mongoose.Schema({

            doc:            {type: String, unique: true},
            firstName:      {type: String, index: true},
            lastName:       {type: String, index: true},
            email:          {type: String, default: null},
            phoneNumber:    {type: String, default: null},
            gender:         {type: String, enum: ["M", "F"]},
            avatarURL:      {type: String, default: null},
            profilePicUrl:  {type: String, default: null},
            birthday:       {type: Date, default: null},

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
                achievements: [userAchievement]
            }

        },
        { collection: 'Users' }
    );

    /**
     * Virtual Attribute to get full name
     * Name: fullName
     */
    userSchema.virtual('fullName').get(function(){
        return this.firstName + ' ' + this.lastName;
    });

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
     * Applies Reward to User and emits event is user reaches new level
     * @param reward - object containing xp and money award
     * @param [skills] - optional. If a skillset is received then, xp is rewarded to each skill. Skill xpRatio is
     * defined on the config file.
     *
     * @emits levelup
     * @emits skilllevelup
     */
    userSchema.methods.applyReward = function(reward, skills) {

        //Get current level before apply xp. This is to check if he has leveled up
        var _oldLevel = this.student.character.levelInfo.level;

        var originalReward = reward;

        //Check for applicable buffs || debuffs
        this.student.character.activeStatusEffects.forEach(function(se){

            if (se.statusEffect.modifies == "goldGained") {
                if (se.statusEffect.type == "buff") reward.money += (originalReward.money * se.statusEffect.amount / 100);
                if (se.statusEffect.type == "debuff") reward.money -= (originalReward.money * se.statusEffect.amount / 100);
            };

            if (se.statusEffect.modifies == "xpGained" && reward.xp > 0) {
                if (se.statusEffect.type == "buff") reward.xp += (originalReward.xp * se.statusEffect.amount / 100);
                if (se.statusEffect.type == "debuff") reward.xp -= (originalReward.xp * se.statusEffect.amount / 100);
            };

            if (se.statusEffect.modifies == "xpLost" && reward.xp < 0) {
                if (se.statusEffect.type == "buff") reward.xp += (originalReward.xp * se.statusEffect.amount / 100);
                if (se.statusEffect.type == "debuff") reward.xp -= (originalReward.xp * se.statusEffect.amount / 100);
            };

        });

        //Apply actual reward
        this.student.character.xp += reward.xp;
        this.student.character.money += reward.money;

        var _newLevel = this.student.character.levelInfo.level;

        if (_newLevel > _oldLevel) eh.emit("levelup", this);

        //If skill is not undefined, apply reward to character skill also
        if (typeof skills != "undefined" && skills != null) {

            var that = this;

            skills.forEach(function(skill){

                //Find skill index...
                var index = _.findIndex(that.student.character.skills, function(s) {
                    return s.skill.toString() == skill.toString();
                });

                if (index == -1) {

                    //Then is a new skill
                    var newSkill = {
                        skill: skill,
                        xp: (reward.xp * config.skills.xpPointsRatio)
                    };

                    that.student.character.skills.push(newSkill);
                }

                else {

                    //Update skill old value
                    var _oldRank = that.student.character.skills[index].rankInfo.rank;
                    that.student.character.skills[index].xp += ( reward.xp * config.skills.xpPointsRatio );
                    var _newRank = that.student.character.skills[index].rankInfo.rank;

                    if (_newRank > _oldRank) {
                        var newRank;

                        //Emit event with populated skill and rank.
                        Rank.findOne({ordinality: _newRank})
                            .then(function(result){
                                newRank = result;
                                return User.populate(that, 'student.character.skills.skill');
                            })
                            .then(function(popUser){
                                eh.emit('skilllevelup', popUser, popUser.student.character.skills[index].skill, newRank);
                            });
                    }
                }

            });

        }


        return this;
    };


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
            goals: []
        };

        _newQuest.goals = quest.goals.map(function(g){
            return {
                goal: g,
                totalSteps: g.amount,
                completedSteps: 0
            }
        });

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
                eh.emit('streaklost', this);
            }

            this.connectionStreakDays = 0;
            this.lastConnection = new Date().clearTime();
            return this.save();
        }


        //If reaches here --> new day steak
        eh.emit('newstreakday', this);
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
            'student.character.quests': {select: 'name reward goals customer'},
            'student.character.quests.goals.goal': {select: 'name type amount skill customer'},
            'student.character.quests.goals.goal.skill': {select: 'name customer icon'},
            'student.character.activities.activity': {select: 'name detail skills rank customer reward'},
            'student.character.activities.activity.skills': {select: 'name icon customer'}
        }
    };

    userSchema.plugin(deepPopulate, options);
    userSchema.plugin(mongoosePaginate);

    var User = mongoose.model('User', userSchema);

    module.exports = User;

}).call(this);