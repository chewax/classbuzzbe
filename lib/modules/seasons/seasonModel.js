(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    /**
     * Season Schema.
     * Will store a customer's seasons
     */
    var seasonSchema = new mongoose.Schema({
            name:       { type: String },
            starts:     { type: Date, default: null },
            ends:       { type: Date, default: null },
            customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null}
        },

        { collection: 'Seasons' }
    );

    seasonSchema.plugin(mongoosePaginate);
    var Season = mongoose.model('Season', seasonSchema);

    module.exports = Season;

}).call(this);

