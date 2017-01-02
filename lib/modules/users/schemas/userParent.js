(function(){
    'use strict';

    var mongoose = require('mongoose');

    /**
     * User Parent Schema
     * Will store the users' parent information...parents may or may not have a user...thats why.
     */
    var userParent = new mongoose.Schema({
        doc: {type: String, default: null},
        firstName: {type: String, default: ""},
        lastName: {type: String, default: ""},
        phoneNumber: {type: String, default: ""},
        email: {type: String, default: ""},
        contactDetails: {type: String, default: ""},
        hasAppAccess: {type:Boolean, default: false}
    });

    module.exports = userParent;

}).call(this);

