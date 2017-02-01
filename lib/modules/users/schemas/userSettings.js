(function(){
    'use strict';

    var mongoose = require('mongoose');

    var userSettings = new mongoose.Schema({
        lang: {
            code: {type: String},
            dsc: {type: String}
        },
        timezone: {type: String}
    });

    module.exports = userSettings;

}).call(this);

