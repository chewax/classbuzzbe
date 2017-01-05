(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');
    var localePlugin = require('../core/plugins/localesPlugin');

    var achievementSchema = new mongoose.Schema({
            name: {type: String},
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null},
            iconUrl: {type: String},
            statProps: [{
                prop: {type: mongoose.Schema.Types.ObjectId, ref: 'StatProp', default: null},
                activationValue: {type: Number},
                activationCondition: {type: String, enum:["ACTIVE_IF_GREATER_THAN", "ACTIVE_IF_LOWER_THAN", "ACTIVE_IF_EQUAL_TO"], default: "ACTIVE_IF_EQUAL_TO"}
            }]
        },

        { collection: 'Achievements' }
    );

    achievementSchema.plugin(mongoosePaginate);
    achievementSchema.plugin(localePlugin);
    module.exports =  mongoose.model('Achievement', achievementSchema);

}).call(this);

