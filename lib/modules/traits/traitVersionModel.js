(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;

    var traitVersionSchema = new mongoose.Schema({
            version: {type:Number, default:0},
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default:null}
        },

        { collection: 'TraitVersions' }
    );

    var TraitVersion = mongoose.model('TraitVersion', traitVersionSchema);

    module.exports =  TraitVersion;

}).call(this);

