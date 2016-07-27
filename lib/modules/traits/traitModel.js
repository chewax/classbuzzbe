(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    var traitSchema = new mongoose.Schema({
            name: String,
            traitType: {type: String, enum: ['body', 'wearable', 'background', 'companion', 'colour'], default:'wearable'},
            placement: {type: String, enum: ['eyes', 'head', 'chest', 'legs', 'feet', 'leftHand', 'rightHand', 'mouth', 'facialHair', 'hair', 'eyebrow', 'upperBody', 'lowerBody', 'companionRight', 'companionLeft'], default:'chest'},
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

