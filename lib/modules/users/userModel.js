(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var Role = require('../roles/roleModel');
    var Group = require('../groups/groupModel');
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
            branch:     {type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null},
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
     * Virtual Attribute to get user groups owned.
     */
    userSchema.virtual('groupsOwned', {
        ref: 'Group',
        localField: '_id',
        foreignField: 'teacher'
    });

    /**
     * Virtual Attribute to get user belonging Groups.
     */
    userSchema.virtual('groupsBelonging', {
        ref: 'Group',
        localField: '_id',
        foreignField: 'students'
    });

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
    userSchema.pre('save', function(next){

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

        return this.deepPopulate(['student.character.traits.wearables.eyes.attributes.attribute',
            'student.character.traits.wearables.head.attributes.attribute',
            'student.character.traits.wearables.chest.attributes.attribute',
            'student.character.traits.wearables.legs.attributes.attribute',
            'student.character.traits.wearables.leftHand.attributes.attribute',
            'student.character.traits.wearables.rightHand.attributes.attribute',
            'student.character.traits.wearables.feet.attributes.attribute',
            'student.character.traits.wearables.companionRight.attributes.attribute',
            'student.character.traits.wearables.companionLeft.attributes.attribute'], function(err, _user){

            if (err) {
                console.log(err);
                return;
            }

            //Get current level before apply xp. This is to check if he has leveled up
            var _oldLevel = _user.student.character.levelInfo.level;
            var originalReward = reward;

            // ALTER REWARD BASED ON EQUIPPED GEAR/PETS
            //To a local var to prevent mongoose recalculating the values each time they are referred.
            var statModifiers = _user.student.character.attributeInfo.modifiers;

            //If money is awarded then increase money based on modifier
            if (reward.money > 0) reward.money += statModifiers.goldGained;

            //If negative xp, dampen loss based on modifier, but if positive xp, increase win based on modifier
            if (reward.xp < 0) reward.xp += statModifiers.xpLost;
            if (reward.xp > 0) reward.xp += statModifiers.xpGained;


            // ALTER REWARD BASED ON ACTIVE BUFFS/DEBUFFS
            //Check for applicable buffs || debuffs (potions, birthday buff, behaviour debuff, etc)
            _user.student.character.activeStatusEffects.forEach(function(se){

                //Only apply money statusEffects if actual money is gained. Otherwise it would gain/lose money every time an activity is completed
                if (se.statusEffect.modifies == "goldGained" && reward.money > 0) {
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
            _user.student.character.xp += reward.xp;
            _user.student.character.money += reward.money;

            var _newLevel = _user.student.character.levelInfo.level;

            if (_newLevel > _oldLevel) eh.emit("levelup", _user);

            //If skill is not undefined, apply reward to character skill also
            if (typeof skills != "undefined" && skills != null) {

                var that = _user;

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



        });

    };

    /**
     * Find a student's teachers
     * @param studentDoc
     * @returns {Promise}
     */
    userSchema.statics.findStudentTeachers = function(studentId) {

        return new Promise (function(resolve, reject){
            Group.find({students:studentId})
                .populate("teacher", "firstName lastName email doc")
                .then(function(groups){

                    var _teachers = groups.map(function(g){
                        return g.teacher;
                    });

                    _teachers = _.uniqBy(_teachers, '_id');

                    resolve(_teachers)
                })
                .catch(function(err){
                    reject(err);
                })
        });

    };

    /**
     * Find a teachrs's students
     * @param studentDoc
     * @returns {Promise}
     */
    userSchema.statics.findTeacherStudents = function(teacherId) {

        var _students = [];

        return new Promise (function(resolve, reject){
            Group.find({teacher:teacherId})
                .populate("students", "doc firstName lastName email avatarURL student.parents student.character.xp student.house")
                .then(function(groups){

                    var _students = _students.concat( groups.map(function(g){
                        return g.students;
                    }));
                    _students = _.uniqBy(_students, '_id');

                    resolve(_students)
                })
                .catch(function(err){
                    reject(err);
                })
        });

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
     * Returns the groups that a user belongs to
     * @returns {Promise|*}
     */
    userSchema.methods.belongingGroups = function () {
        return Group.find({students:this._id});
    };

    /**
     * Returns the groups that a user owns
     * @returns {Promise|*}
     */
    userSchema.methods.ownedGroups = function () {
        return Group.find({teacher:this._id});
    };

    var options = {
        populate: {
            'roles': {select: 'name mayGrant'},
            'roles.mayGrant': {select: 'name'},
            'parent.children': {select: 'firstName lastName'},

            'student.character.traits.wearables.eyes': {select: 'name traitType placement previewImageURL requirements attributes enabled'},
            'student.character.traits.wearables.head': {select: 'name traitType placement previewImageURL requirements attributes enabled'},
            'student.character.traits.wearables.chest': {select: 'name traitType placement previewImageURL requirements attributes enabled'},
            'student.character.traits.wearables.legs': {select: 'name traitType placement previewImageURL requirements attributes enabled'},
            'student.character.traits.wearables.leftHand': {select: 'name traitType placement previewImageURL requirements attributes enabled'},
            'student.character.traits.wearables.rightHand': {select: 'name traitType placement previewImageURL requirements attributes enabled'},
            'student.character.traits.wearables.feet': {select: 'name traitType placement previewImageURL requirements attributes enabled'},
            'student.character.traits.wearables.companionRight': {select: 'name traitType placement previewImageURL requirements attributes enabled'},
            'student.character.traits.wearables.companionLeft': {select: 'name traitType placement previewImageURL requirements attributes enabled'},

            'student.character.traits.wearables.eyes.attributes.attribute': {select: 'name customer modifies'},
            'student.character.traits.wearables.head.attributes.attribute': {select: 'name customer modifies'},
            'student.character.traits.wearables.chest.attributes.attribute': {select: 'name customer modifies'},
            'student.character.traits.wearables.legs.attributes.attribute': {select: 'name customer modifies'},
            'student.character.traits.wearables.leftHand.attributes.attribute': {select: 'name customer modifies'},
            'student.character.traits.wearables.rightHand.attributes.attribute': {select: 'name customer modifies'},
            'student.character.traits.wearables.feet.attributes.attribute': {select: 'name customer modifies'},
            'student.character.traits.wearables.companionRight.attributes.attribute': {select: 'name customer modifies'},
            'student.character.traits.wearables.companionLeft.attributes.attribute': {select: 'name customer modifies'},

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