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
            icon:       { type: String },
            ordinality: { type: Number } //States which rank comes first.
        },

        { collection: 'Ranks' }
    );

    rankSchema.statics.bake = function (ranks) {
        console.log("Baking Ranks".green);
        ranks.forEach(function(r){
            var _newRank = new Rank();
            _newRank.name = r.name;
            _newRank.ordinality = r.ordinality;
            _newRank.save();
        })
    };

    rankSchema.plugin(mongoosePaginate);
    var Rank = mongoose.model('Rank', rankSchema);
    module.exports = Rank;

}).call(this);
