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

    /**
     * Virtual Attribute to get house students
     */
    houseSchema.virtual('students', {
        ref: 'Users',
        localField: '_id',
        foreignField: 'student.house'
    });


    //For Virtual Fields
    houseSchema.set('toObject', { virtuals: true });
    houseSchema.set('toJSON', { virtuals: true });

    houseSchema.plugin(mongoosePaginate);

    var House = mongoose.model('House', houseSchema);

    module.exports =  House;

}).call(this);
