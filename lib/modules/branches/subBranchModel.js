(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;

    var subBranchSchema = new mongoose.Schema({
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

            branch: {type: mongoose.Schema.Types.ObjectId, ref: 'Branch'},
            principal: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
        },

        {  collection: 'SubBranches' }

    );

    var SubBranch = mongoose.model('SubBranch', subBranchSchema);
    module.exports =  SubBranch;

}).call(this);

