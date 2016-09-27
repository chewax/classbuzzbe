(function(){
    'use strict';

    var mongoose = require('mongoose');

    /**
     * Character Trait Schema
     * Will store the users character's currently equipped items information
     */
    var characterTraits = new mongoose.Schema({
        body: {
            head: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
            upperBody: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
            lowerBody: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
            eyes: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
            mouth: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
            hair: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
            facialHair: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
            colour: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
            eyebrows: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null}
        },

        wearables: {
            eyes: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
            head: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
            chest: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
            legs: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
            leftHand: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
            rightHand: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
            feet: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
            companionRight: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
            companionLeft: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null}
        },

        background: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null}
    });


    module.exports = characterTraits;

}).call(this);