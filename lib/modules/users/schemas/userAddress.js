(function(){
    'use strict';

    var mongoose = require('mongoose');

    /**
     * User Address Schema
     * Will store the users' address.
     */
    var userAddress = new mongoose.Schema({
        street: {type: String},
        number: {type: String},
        city: {type: String},
        state: {type: String},
        zip: {type: String},
        country: {type: String}
    });

    module.exports = userAddress;

}).call(this);

