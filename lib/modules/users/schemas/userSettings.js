(function(){
    'use strict';

    var mongoose = require('mongoose');

    var userSettings = new mongoose.Schema({
        lang: {
            code: {type: String, default: 'en'},
            dsc: {type: String, default: "English"}
        },
        timezone: {type: String, default: "America/Montevideo"}
    });

    module.exports = userSettings;

}).call(this);

