(function(){
    'use strict';

    var mongoose = require('mongoose');

    /**
     * Character Skills
     * Will store a character skillset
     */
    var characterSkill = new mongoose.Schema({
        skill: {type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default: null},
        xp: {type: Number, default: 0}
    });


    /**
     * Virtual Attribute to calculate skillRank and info.
     * Name: rankInfo.
     */
    characterSkill.virtual('rankInfo').get(function(){
        var xp = this.xp;
        var k = 0.2; //Controls how fast the skill levels up.
        var rank = Math.floor(Math.sqrt(xp) * k);
        var xpPrev =  Math.round(Math.pow((rank-1)/k, 2));
        var xpNext =  Math.round(Math.pow((rank+1)/k, 2));
        var xpCurr =  Math.round(Math.pow((rank)/k, 2));

        return {
            rank: rank+1,
            xpToPrevious: xpPrev,
            xpToCurrent: xpCurr,
            xpToNext: xpNext
        }
    });


    characterSkill.set('toObject', { virtuals: true });
    characterSkill.set('toJSON', { virtuals: true });


    module.exports = characterSkill;

}).call(this);
