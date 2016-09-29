(function(){
    'use strict';

    var mongoose = require('mongoose');

    /**
     * User Credentials Schema
     * Will store the users' locale info.
     */
    var userCredentials = new mongoose.Schema({
        username: {type: String, unique: true},
        password: {type: String}
    });

    module.exports = userCredentials;

}).call(this);

