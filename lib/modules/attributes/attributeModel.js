(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var _ = require('lodash');
    var config = require('../../config');

    var attributeSchema = new mongoose.Schema({

            /*
            * Each unit of an attribute applies one or more status effects. So +1 intellect grants 2 effects:
            * XPGained x 5
            * XPLossPrevention x 5
            *
            * So:
            *   a user intellect is the sum of all the traits that grant intellect.
            *   to calculate a statusEffect thou shalt check for all attributes that modify that attribute and
            *   then check for temporary statusEffects.
            *
            *   Check Traits for attributes.
            *   StatusEffects for statusEffects
            *
            * */

            name: { type: String }, //Intellect, Luck, Resilience, Dexterity, Agility, Aura
            detail: { type: String },

            modifies: [{
                attribute: {type: String, enum: config.statusModifiers},
                amount: {type: Number, default: 0} //Absolute, not percentage (1 means 1 more gold each time not 1% more gold)
            }],

            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null},
            createdAt:  { type: Date, default: Date.now },
            updatedAt:  { type: Date, default: Date.now }

        },

        { collection: 'Attributes' }
    );


    attributeSchema.pre('save', function(next){
        this.updatedAt = Date.now();
        next();
    });

    attributeSchema.pre('update', function() {
        this.update({}, { $set: { updatedAt: new Date() } });
    });

    var Attribute = mongoose.model('Attribute', attributeSchema);

    module.exports =  Attribute;

}).call(this);
