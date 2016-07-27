(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    var defaultTraitSchema = new mongoose.Schema({
            name: String,
            gender: {type: String, enum: ['M', 'F'], default:'M'},
            body: {
                head: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                upperBody: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                lowerBody: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                eyes: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                eyebrows: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                mouth: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                hair: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                faceHair: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null}
            },

            wearables: {
                head: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                chest: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                legs: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                eyes: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                feet: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                leftHand: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                rightHand: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null}
            }
        },

        { collection: 'DefaultTraits' }

    );

    // Plugins =============
    defaultTraitSchema.plugin(mongoosePaginate);
    // ===================

    var DefaultTrait = mongoose.model('DefaultTrait', defaultTraitSchema);

    module.exports =  DefaultTrait;

}).call(this);

