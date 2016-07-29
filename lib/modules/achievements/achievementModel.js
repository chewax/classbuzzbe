(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    var achievementSchema = new mongoose.Schema({
            name: {type: String},
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null},
            iconUrl: {type: String},
            statProps: [{type: mongoose.Schema.Types.ObjectId, ref: 'StatProp', default: null}]
        },

        { collection: 'Achievements' }
    );

    achievementSchema.plugin(mongoosePaginate);
    module.exports =  mongoose.model('Achievement', achievementSchema);

}).call(this);

