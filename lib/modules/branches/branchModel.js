(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;

    var branchSchema = new mongoose.Schema({
            name: String,
            email: String,
            phoneNumber: String,
            address: {
                street: String,
                number: String,
                city: String,
                state: String,
                zip: String
            },

            registerCode: {type:String, unique:true, default:""},
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer'},
            headmaster: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}

        },

        {   collection: 'Branches' }

    );

    var Branch = mongoose.model('Branch', branchSchema);
    module.exports =  Branch;

}).call(this);
