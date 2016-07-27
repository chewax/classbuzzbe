(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    var houseSchema = new mongoose.Schema({
            name: String,
            logo: String, //URL,
            score: Number,
            head: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default:null},
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default:null}
        },

        { collection: 'Houses' }

    );

    houseSchema.plugin(mongoosePaginate);

    var House = mongoose.model('House', houseSchema);

    module.exports =  House;

}).call(this);
