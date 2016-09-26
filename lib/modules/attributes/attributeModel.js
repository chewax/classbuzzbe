(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var _ = require('lodash');

    var attributeSchema = new mongoose.Schema({

            name: { type: String }, //Intellect, Luck, Resilience, Dexterity, Agitlity, Aura
            detail: { type: String },
            statusEffects: [{type: mongoose.Schema.Types.ObjectId, ref: 'StatusEffect', default: []}],
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
