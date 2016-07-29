(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    var statPropSchema = new mongoose.Schema({
            name: {type: String},
            initialValue: {type: Number},
            activationValue: {type: Number},
            activationCondition: {type: String}
        },

        { collection: 'StatProps' }
    );

    statPropSchema.plugin(mongoosePaginate);
    module.exports =  mongoose.model('StatProp', statPropSchema);

}).call(this);
