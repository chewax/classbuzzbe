(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;

    var statusEffectSchema = new mongoose.Schema({

            name: { type: String },
            type: { type: String, enum:[ "buff", "debuff" ], default: "buff" },
            modifies: {type: String, enum: ["goldGained", "xpGained", "xpLost", "houseContribution", "questSlots"]},
            amount: {type:Number, default: 0}, //0-100;
            duration: { type: Number },
            detail: { type: String },
            createdAt:  { type: Date, default: Date.now },
            updatedAt:  { type: Date, default: Date.now }

        },

        { collection: 'StatusEffects' }
    );


    statusEffectSchema.pre('save', function(next){
        this.updatedAt = Date.now();
        next();
    });

    statusEffectSchema.pre('update', function() {
        this.update({}, { $set: { updatedAt: new Date() } });
    });

    var StatusEffect = mongoose.model('StatusEffect', statusEffectSchema);

    module.exports =  StatusEffect;

}).call(this);
