(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var config = require('../../config');

    var statusEffectSchema = new mongoose.Schema({

            name: { type: String },
            type: { type: String, enum:[ "buff", "debuff" ], default: "buff" },

            modifies: {type: String, enum: config.statusModifiers},
            power: {type: String, enum: config.statusEffectPower},

            amount: {type:Number, default: 0}, //0-100;
            detail: { type: String }
        },

        { collection: 'StatusEffects' }
    );


    var StatusEffect = mongoose.model('StatusEffect', statusEffectSchema);

    module.exports =  StatusEffect;

}).call(this);
