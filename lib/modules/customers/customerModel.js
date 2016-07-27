(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var deepPopulate = require('mongoose-deep-populate')(mongoose);

    var customerSchema = new mongoose.Schema({

        name: String,
        email: String,
        phoneNumber: String,
        logoURL: String,

        address: {
            street: String,
            number: Number,
            city: String,
            state: String,
            zip: String
        },

        houses: [{type: mongoose.Schema.Types.ObjectId, ref: 'House'}],
        lastSorted: {type: mongoose.Schema.Types.ObjectId, ref: 'House',  default: null}

    },
    {
        collection: 'Customers'
    }
    );

    var options = {
        populate: {
            'houses' : {select:'head name score'},
            'houses.head' : {select:'firstName lastName'},
            'branches' : {select: 'name headmaster'},
            'branches.headmaster' : {select:'firstName lastName'}
        }
    };

    customerSchema.plugin(deepPopulate, options);

    var Customer = mongoose.model('Customer', customerSchema);

    module.exports =  Customer;

}).call(this);