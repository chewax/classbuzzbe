(function(){
    'use strict';

    var mongoose = require('mongoose');
    var moment = require('moment');

    /**
     * Character Status Effects
     * Will store a character status effect
     */
    var characterStatusEffect = new mongoose.Schema({
        statusEffect: {type: mongoose.Schema.Types.ObjectId, ref: 'StatusEffect', default: []},
        assigned: { type: Date, default: Date.now },
        duration: { type: Number, default: 48 } //Hours
    });

    /**
     * Status Effect Virtual Attribute to find out the expiration date of a status effect
     * Name: validTo.
     */
    characterStatusEffect.virtual('validTo').get(function(){
        return moment(this.assigned).add(this.duration, 'hours');
    });

    /**
     * Status Effect Virtual Attribute to find out the validity of a status effect
     * Name: isActive.
     */
    characterStatusEffect.virtual('isActive').get(function(){
        return this.assigned <= Date.now() && Date.now() <= this.validTo;
    });


    characterStatusEffect.set('toObject', { virtuals: true });
    characterStatusEffect.set('toJSON', { virtuals: true });


    module.exports = characterStatusEffect;

}).call(this);