(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var Role = require('../roles/roleModel');
    var Group = require('../groups/groupModel');
    var Rank = require('../ranks/rankModel');
    var specialEventsModel = require('../specialEvents/specialEventsModel');
    var seModel = require('../statusEffect/statusEffectModel');
    var chestModel = require('../chests/chestModel');
    var logger = require('../log/logger').getLogger();
    var deepPopulate = require('mongoose-deep-populate')(mongoose);
    var mongoosePaginate = require('mongoose-paginate');
    var eh = require('../core/eventsHandler');
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

            roles:      [{type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null, index:true}],
            customer:   {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null, index:true},
            branch:     {type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null},

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
     * Virtual Attribute to get user statProps.
     */
    userSchema.virtual('statProps', {
        ref: 'UserStatProp',
        localField: '_id',
        foreignField: 'user'
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

        //Sanitize User Info
        this.firstName = this.firstName.capitalize();
        this.lastName = this.lastName.capitalize();
        this.doc = this.doc.removeChar('.');
        this.doc = this.doc.removeChar('-');

        next();
    });


    userSchema.statics.findMinified = function (userId) {
        return User.findOne({_id:userId})
            .lean(true)
            //.select('doc firstName lastName avatarURL')
            .select('doc firstName lastName')
    }


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

        var that = this;

        return new Promise(function (resolve, reject) {

            that.deepPopulate(['student.character.traits.wearables.eyes.attributes.attribute',
                'student.character.traits.wearables.head.attributes.attribute',
                'student.character.traits.wearables.chest.attributes.attribute',
                'student.character.traits.wearables.legs.attributes.attribute',
                'student.character.traits.wearables.leftHand.attributes.attribute',
                'student.character.traits.wearables.rightHand.attributes.attribute',
                'student.character.traits.wearables.feet.attributes.attribute',
                'student.character.traits.wearables.companionRight.attributes.attribute',
                'student.character.traits.wearables.companionLeft.attributes.attribute'], function(err, _user){

                if (err) {
                    reject(err);
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
                    var promises = [];

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

                            if (newSkill.xp < 0) newSkill.xp = 0;

                            that.student.character.skills.push(newSkill);
                        }

                        else {

                            //Update skill old value
                            var _oldRank = that.student.character.skills[index].rankInfo.rank;
                            that.student.character.skills[index].xp += ( reward.xp * config.skills.xpPointsRatio );
                            if (that.student.character.skills[index].xp < 0) that.student.character.skills[index].xp = 0;
                            var _newRank = that.student.character.skills[index].rankInfo.rank;

                            if (_newRank > _oldRank) {
                                var newRank;

                                //Emit event with populated skill and rank.
                                promises.push (

                                    Rank.findOne({ordinality: _newRank})
                                        .then(function(result){
                                            newRank = result;
                                            return User.populate(that, 'student.character.skills.skill');
                                        })
                                        .then(function(popUser){
                                            eh.emit('skilllevelup', popUser, popUser.student.character.skills[index].skill, newRank);
                                        })
                                )
                            }

                            if (_newRank < _oldRank) {
                                var newRank;

                                //Emit event with populated skill and rank.
                                promises.push (

                                    Rank.findOne({ordinality: _newRank})
                                        .then(function(result){
                                            newRank = result;
                                            return User.populate(that, 'student.character.skills.skill');
                                        })
                                        .then(function(popUser){
                                            eh.emit('skillleveldown', popUser, popUser.student.character.skills[index].skill, newRank);
                                        })
                                )
                            }
                        }

                    });

                    Promise.all(promises)
                        .then(function(result){
                            resolve(_user);
                        })
                }

                else {
                    resolve(_user);
                }

            });

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
     * Find a student's teachers
     * @param studentDoc
     * @returns {Promise}
     */
    userSchema.methods.findStudentTeachers = function() {

        var _student = this;

        return new Promise (function(resolve, reject){
            Group.find({students:_student._id})
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

        return new Promise (function(resolve, reject){

            Group.find({teacher:teacherId})
                .populate("students", "firstName lastName email student.parents student.character student.house avatarURL")
                .then(function(groups){

                    var _students = [];

                    groups.forEach(function(g){
                        if (!_.isNil(g.students)) _students = _students.concat(g.students);
                    });

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

    userSchema.methods.addStatusEffect = function( sePower, seType, seModifiers, duration ) {
        var that = this;
        return seModel.find({
            $and:[
                { power: sePower},
                { type: seType},
                { modifies: {$in: seModifiers} }
            ]})
            .then(function(statusEffects){

                statusEffects.forEach(function(se){
                    var newdoc = that.student.character.statusEffects.create({});
                    newdoc.statusEffect = se;
                    newdoc.duration = 10 * 24; //10 days times 24 hours a day.
                    that.student.character.statusEffects.push(newdoc);
                });

                return that.save();
            })
    };


    /**
     * Assigns a Random chest to user from a list of eligible chests
     * @param [] eligibleChests
     * @param {number} oddsModifier - Defaults to zero
     * @returns {*}
     */
    userSchema.statics.awardChest = function (userId, eligibleChests, oddsModifier) {
        var _chest = {};

        return User.findOne(userId)
            .then(function(_user){
                if (typeof oddsModifier == 'undefined' || oddsModifier == null) oddsModifier = 0;

                var chestAward = _user.student.character.chests.create();                               //Create CharacterChest Object.

                _chest = eligibleChests[Math.floor(Math.random() * eligibleChests.length)];             //Pick a Random Eligible Chest
                chestAward.chest = _chest;

                chestAward.oddsModifier = oddsModifier;                                                 //Assign the odds modifier
                _user.student.character.chests.push(chestAward);                                        //Push Chest && save
                return _user.save();
            })
            .then(function(_user){
                eh.emit('chestaward', _user, _chest);
            })
    };

    userSchema.methods.completeSpecialEvent = function (eventId, grade) {

        var _user = this;
        var _chest = {};

        return new Promise(function(resolve, reject){
            specialEventsModel.findOne({_id: eventId})
                .populate('eligibleChests')
                .then(function(_event){

                    var userSpecialEvents = _user.student.character.specialEvents;
                    var spIndex = _.findIndex(userSpecialEvents, function(sp){
                        return sp.specialEvent.toString() == eventId.toString();
                    });

                    // Does the user has this special event assigned?
                    if (spIndex == -1) resolve('Student has not been assigned this special event');

                    userSpecialEvents[spIndex].completed = Date.now(); // Assign as completed.
                    userSpecialEvents[spIndex].grade = grade; // Assign grade

                    // Did the player pass the special event? If not, save result without granting chest.
                    if ( grade < _event.approvesWith) {
                        return _user.save();
                    }

                    // Now the tricky part.
                    // If the grade is good enough to pass, the user will be rewarded a chest.
                    // The grade awarded above "pass" enhances the player odds to receive a better loot.
                    // For the time being the odds modifier will be linear.
                    // By default, we allow only grades between 1-5 (stars)
                    // To know the minimum required grade we should access the specialEvent property approvesWith.
                    // But first of all we have to pick a chest from the DB. The way we are going to do this is by specialEvent (boss) difficulty.

                    var eligibleChests = _event.eligibleChests;

                    //Create CharacterChest Object.
                    var chestAward = _user.student.character.chests.create();

                    //Pick a Random Eligible Chest
                    _chest = eligibleChests[Math.floor(Math.random() * eligibleChests.length)];
                    chestAward.chest = _chest;

                    //Assign the odds modifier
                    chestAward.oddsModifier = grade; //TODO Maybe transform this in a non linear scale.

                    //Push chest && save
                    _user.student.character.chests.push(chestAward);
                    return _user.save();
                })
                .then(function(result){
                    eh.emit('chestaward', _user, _chest);

                    resolve(result);
                })
                .catch(function(err){
                    reject(err);
                })
        });
    };

    userSchema.methods.openChest = function (characterChestId) {
        var _user = this;
        var droppedItems = [];
        var lootItems = [];
        var previouslyOwned = [];
        var itemsGold = 0;

        //The id passed is the subdocument id. We should fetch the corresponding chestId which is stored as a reference in chest attribute
        var characterChest = _user.student.character.chests.id(characterChestId);
        return new Promise ( function(resolve, reject) {
            chestModel.findOne({_id:characterChest.chest})
                .populate('loot.item')
                .then(function(chest){

                    // Ok, tricky part again...
                    // The user can only "open" the chest if all the skills requirements are met, or if there are no skill requirements whatsoever.
                    // So if the chest is skillbound, for each of the required skills, loop the character skill and check if he/she meets that requirement.

                    var skillRequirementsAreMet = true;

                    if (chest.isSkillBound) {
                        chest.skillsNeeded.forEach(function(requiredSkill){
                            // Retrieve users related skill.

                            var i = _.findIndex(_user.student.character.skills, function(userSkill){
                                return userSkill.skill.toString() == requiredSkill.skill.toString();
                            });

                            // If the user is missing a rank then the result is absolute.
                            if (i == -1) {
                                skillRequirementsAreMet = false;
                                return;
                            }

                            // Otherwise check if this skill requirements are met
                            skillRequirementsAreMet = skillRequirementsAreMet && (_user.student.character.skills[i].rankInfo.rank >= requiredSkill.minRank)
                        })
                    }

                    if (!skillRequirementsAreMet) return Promise.resolve({
                            opened: false,
                            reason: "Did not meet skill requirements"
                    });

                    // Upon ending previous if. Either did not enter and the result is true or the result is the correspoding value.
                    // So, if skillRequirementsAreMet, the chest can be opened...another tricky part.
                    // We must decide which of the possible loot items are to be rewarded.
                    // For that we must take into consideration the dropRate that is stored alongside the item
                    // and the oddsModifier that belongs to the user (this is a reflection of the user performance on the specialEvent that triggered the chest award)
                    // Note that if for some reason the chest was granted in a process other than special event or was purchased in the store
                    // the oddsModifier attribute shall have a value of 0, so all multiplication, although futiles, will not change the odds.

                    // So, for each possible loot item, we must decide (based on the odds) if it will be droped or not.

                    chest.loot.forEach(function(lootElement){

                        // diceRoll will contain a number between 0 and 1. The max odds are 1 so all numbers that
                        // can be assigned to diceRoll are <= 1.
                        var diceRoll = Math.random();

                        // now we must consider the oddsModifier. For that we are going to create a new var
                        // containing the newOdds for this item.
                        // if characterChest.oddsModifier == 0
                        // characterChest.oddsModifier / 10 == 0
                        // 1 + 0 == 1
                        // so DropRate not modified.
                        // Otherwise if characterChest.oddsModifier == 3
                        // characterChest.oddsModifier / 10 == 0.3
                        // 1 + 0.3 = 1.3
                        // so dropRate will be 30% more.
                        var shiftedDropRate = lootElement.dropRate * ( 1 + (characterChest.oddsModifier/10) );

                        if (diceRoll <= shiftedDropRate) {
                            //Great the user won this item.
                            droppedItems.push(lootElement.item);
                        }

                    });

                    // Set chest opened timestamp which in turns sets chest as opened.
                    characterChest.opened = Date.now();

                    // Finally if the user already have some of the dropped items, we will convert those items to gold.
                    previouslyOwned = _.intersectionBy(droppedItems, _user.student.character.inventory, function(item){
                        if (typeof item._id != 'undefined') return item._id.toString();
                        else return item.toString();
                    });

                    lootItems = _.differenceBy(droppedItems, previouslyOwned, function(item){
                        return item._id.toString();
                    });

                    //Calculate how much gold the user earned from alreadyOwned droppd items
                    previouslyOwned.forEach(function(item){
                        itemsGold += item.price * config.alreadyOwnedItemGoldRate;
                    });

                    _user.student.character.money += itemsGold;

                    // Add actual loot items to inventory
                    _user.student.character.inventory = _user.student.character.inventory.concat(lootItems);

                    //Add xp && money
                    var reward = {
                        xp: chest.xp,
                        money: chest.money
                    };

                    return _user.applyReward(reward)
                        .then(function(rewardedUser){
                            return rewardedUser.save();
                        })
                        .then(function(savedUser){
                            return Promise.resolve({
                                droppedItems: droppedItems,
                                loot: lootItems,
                                previouslyOwned: previouslyOwned,
                                goldConversion: itemsGold
                            })
                        })
                })

                .then(function(result){
                    resolve(result);
                })
                .catch(function(err){
                    reject(err);
                })
        });
    }

    /**
     * Adds special event to user.
     * @param specialEvent
     * @returns {*}
     */
    userSchema.methods.addSpecialEvent = function(specialEvent) {
        this.student.character.specialEvents.push({
            specialEvent: specialEvent._id
        });

        return this.save();
    };

    var options = {
        populate: {
            'roles': {select: 'name mayGrant'},
            'roles.mayGrant': {select: 'name'},
            'parent.children': {select: 'firstName lastName'},

            'student.character.specialEvents.specialEvent.eligibleChests': {select: 'name'},

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