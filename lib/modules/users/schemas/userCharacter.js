(function(){
    'use strict';

    var mongoose = require('mongoose');
    var _ = require('lodash');
    var config = require('../../../config');

    var characterStatusEffect = require('./characterStatusEffect');
    var characterTraits = require('./characterTraits');
    var characterSkill = require('./characterSkill');
    var characterQuest = require('./characterQuest');
    var characterChest = require('./characterChest');
    var characterSpecialEvent = require('./characterSpecialEvent');

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
        chests: [characterChest],
        specialEvents: [characterSpecialEvent],

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


    /**
     * Virtual Attribute to calculate attribute Info (Intellect, Dexterity...etc).
     * Name: attributeInfo.
     * Returns an object containing the attrbiutes and the modifiers.
     */
    userCharacter.virtual('attributeInfo').get(function(){

        var statusModifiers = {};
        var attributes = {};

        //Get the status modifiers in a format that can easily be managed
        config.statusModifiers.forEach(function(sm){
            statusModifiers[sm] = 0;
        });

        var charWearables = this.traits.wearables;

        config.characterWearables.forEach(function(cw){

            if (charWearables[cw] == null) return;

            var traitAttributes = charWearables[cw].attributes;

            if (typeof traitAttributes == 'undefined' || traitAttributes.length < 1) return;

            traitAttributes.forEach(function(traitAttribute){

                var attName = traitAttribute.attribute.name;
                var attModifiers = traitAttribute.attribute.modifies;
                var attValue = traitAttribute.amount;

                if (typeof attributes[attName] != 'undefined') attributes[attName] += attValue;
                else attributes[attName] = attValue;

                attModifiers.forEach(function(m){
                    statusModifiers[m.attribute] += ( m.amount * attValue);
                })

            });

        });

        return {
            attributes: attributes,
            modifiers: statusModifiers
        }

    });

    userCharacter.set('toObject', { virtuals: true });
    userCharacter.set('toJSON', { virtuals: true });


    module.exports = userCharacter;

}).call(this);
