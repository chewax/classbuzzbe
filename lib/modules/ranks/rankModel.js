(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    /**
     * Ranks Schema.
     * Will store the ranks for the skills.
     * eg: Apprentice, Journeyman, Expert, Artisan, Master, Grand Master, Illustrious Grand Master, Zen Master
     * Customer should be treated as a restriction attribute. With customer set to null, rank applies to all customers.
     */
     var newSchema = new mongoose.Schema({
            name:       { type: String },
            customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
            ordinality: { type: Number }, //States which rank comes first.
            createdAt:  { type: Date, default: Date.now },
            updatedAt:  { type: Date, default: Date.now }
        },

        { collection: 'Ranks' }
    );

    newSchema.pre('save', function(next){
        this.updatedAt = Date.now();
        next();
    });

    newSchema.pre('update', function() {
        this.update({}, { $set: { updatedAt: new Date() } });
    });

    newSchema.plugin(mongoosePaginate);
    module.exports = mongoose.model('Rank', newSchema);

}).call(this);
