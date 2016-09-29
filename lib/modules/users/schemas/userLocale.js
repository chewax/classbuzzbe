(function(){
    'use strict';

    var mongoose = require('mongoose');

    /**
     * User Locale Schema
     * Will store the users' locale info.
     */
    var userLocale = new mongoose.Schema({
        code: {type: String},
        timezone: {type: String}
    });

    module.exports = userLocale;

}).call(this);

