(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');
    var config = require('../../config');

    var traitSchema = new mongoose.Schema({
            name: String,
            traitType: {type: String, enum: ['body', 'wearable', 'background', 'companion', 'colour', 'consumable'], default:'wearable'},
            placement: {type: String, enum: config.characterPlacements, default:'chest'},
            previewImageURL: {type: String, default:null},
            foreImageURL: {type: String, default:null},
            backImageURL: {type: String, default:null},
            price: {type: Number, default:0},
            offsetX: {type: Number, default:0},
            offsetY: {type: Number, default:0},
            offsetBackX: {type: Number, default:0},
            offsetBackY: {type: Number, default:0},
            offsetMobileX: {type: Number, default:0},
            offsetMobileY: {type: Number, default:0},
            offsetMobileBackX: {type: Number, default:0},
            offsetMobileBackY: {type: Number, default:0},
            orderInLayerForeImage: {type: Number, default:0},
            orderInLayerBackImage: {type: Number, default:0},

            requirements: {price: {type: Number, default:0},
                level: {type: Number, default:1},
                trait: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null}
            },

            attributes: [{
                attribute: {type: mongoose.Schema.Types.ObjectId, ref: 'Attribute', default:null},
                amount: {type: Number, default: 0}
            }],

            enabled: {type:Boolean, default:true},
            visible: {type:Boolean, default:true}
        },

        { collection: 'Traits' }

    );

    // Plugins =============
    traitSchema.plugin(mongoosePaginate);
    // ===================

    var Trait = mongoose.model('Trait', traitSchema);

    module.exports =  Trait;

}).call(this);

