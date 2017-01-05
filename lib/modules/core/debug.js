(function(){
    'use strict';
    var moment = require('moment');

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

        sub_title: function(text){
            console.log(text.cyan + " ---");
        },

        end: function (){
            var text = formatDash("", 40, '-');
            console.log(text.cyan);
        },

        log: function(text){
            console.log(text.grey);
        },

        info: function(text, color, addTimestamp){
            if (typeof color == 'undefined' || color == null) color = 'green';
            if (typeof addTimestamp == 'undefined' || addTimestamp == null) addTimestamp = false;

            text = '[classbuzz] ' + text;
            if (addTimestamp) text += ' @ ' + moment().format();

            switch (color) {
                case 'green':
                    console.log(text.green);
                    break;

                case 'cyan':
                    console.log(text.cyan);
                    break;

                case 'grey':
                    console.log(text.grey);
                    break;

                case 'blue':
                    console.log(text.blue);
                    break;

                case 'red':
                    console.log(text.red);
                    break;

                case 'yellow':
                    console.log(text.yellow);
                    break;

                default:
                    console.log(text);
            }
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
