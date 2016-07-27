(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    var groupLevelSchema = new mongoose.Schema({
            name: String,
            code: String,
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null}
        },
        { collection: 'GroupLevels' }
    );

    groupLevelSchema.plugin(mongoosePaginate);

    var GroupLevel = mongoose.model('GroupLevel', groupLevelSchema);

    module.exports =  GroupLevel;

}).call(this);
