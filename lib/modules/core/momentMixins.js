(function(){

    'use strict';

    var moment = require('moment');

    moment.fn.forLocale = function(locale, fn) {
        var temp = moment.locale();
        moment.locale(locale);
        var result = fn();
        moment.locale(temp);
        return result;
    };

}).call(this);
