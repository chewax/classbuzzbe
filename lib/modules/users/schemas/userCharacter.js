(function(){
    'use strict';

    var mongoose = require('mongoose');
    var _ = require('lodash');

    var characterStatusEffect = require('./characterStatusEffect');
    var characterTraits = require('./characterTraits');
    var characterSkill = require('./characterSkill');
    var characterQuest = require('./characterQuest');

    /**
     * Character Schema
     * Will store the users' character information
     */
    var userCharacter = new mongoose.Schema({

        inventory: [{type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null}],
        statusEffects: [characterStatusEffect],
        isAlive: {type:Boolean, default: true},
        traits: characterTraits,
        xp: {type: Number, default: 0},
        money: {type: Number, default: 0},

        activities: [{
            activity: {type: mongoose.Schema.Types.ObjectId, ref: 'Activity', default: null},
            timestamp: {type:Date, default: Date.now}
        }],

        skills: [characterSkill],
        quests: [characterQuest],
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
     * Virtual Attribute to get active status effects
     * Name: activeStatusEffects.
     */
    userCharacter.virtual('activeStatusEffects').get(function(){

        var activeSE = _.filter(this.statusEffects, function(se){
            return se.isActive;
        });

        return activeSE;
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


    module.exports = userCharacter;

}).call(this);
