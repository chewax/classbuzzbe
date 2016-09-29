(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    var chestSchema = new mongoose.Schema({

            name: {type: String},
            difficulty: {type: String, enum: ["easy", "medium", "hard"]},

            xp: {type: Number},
            money: {type: Number},

            loot: [{
                item: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                dropRate: {type: Number, default: 100}
            }]

        },

        { collection: 'Chests' }
    );

    chestSchema.plugin(mongoosePaginate);
    module.exports =  mongoose.model('Chest', chestSchema);

}).call(this);
