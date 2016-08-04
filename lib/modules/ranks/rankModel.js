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
     var rankSchema = new mongoose.Schema({
            name:       { type: String },
            customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
            ordinality: { type: Number }, //States which rank comes first.
            createdAt:  { type: Date, default: Date.now },
            updatedAt:  { type: Date, default: Date.now }
        },

        { collection: 'Ranks' }
    );

    rankSchema.pre('save', function(next){
        this.updatedAt = Date.now();
        next();
    });

    rankSchema.pre('update', function() {
        this.update({}, { $set: { updatedAt: new Date() } });
    });

    rankSchema.statics.bake = function (ranks, customerId) {
        console.log("Baking Ranks".green);
        ranks.forEach(function(r){
            var _newRank = new Rank();
            _newRank.name = r.name;
            _newRank.ordinality = r.ordinality;
            _newRank.customer = customerId;
            _newRank.save();
        })
    };

    rankSchema.plugin(mongoosePaginate);
    var Rank = mongoose.model('Rank', rankSchema);
    module.exports = Rank;

}).call(this);
