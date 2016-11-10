(function(){
    'use strict';

    var debug = {

        section: function(title){
            if (typeof title == 'undefined') title = 'SECTION';
            title = formatDash(title, 40, '=', true);
            console.log(title.cyan);
        },

        title: function(title){
            title = formatDash(title, 40, '-');
            console.log(title.cyan);
        },

        log: function(text){
            console.log(text.grey);
        }

    };

    function formatDash (text, width, dash, upper) {

        if (typeof upper == 'undefined' || upper == null) upper = false;

        var l = text.length;
        var count = (width - l - 1)/2;

        var fText = "";
        for (var i = 1; i <= count; i++) fText += dash;
        if (upper) fText += text.toUpperCase();
        else fText += text;
        for (var i = 1; i <= count; i++) fText += dash;

        return fText;
    }

    module.exports = debug;

}).call(this);
