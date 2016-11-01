(function(){

    var _ = require('lodash');

    /**
     * Generates a Random string of length == size
     * @param size
     * @returns {string}
     */
    function randStr(size, allowDigits, allowCharacters) {

        if (typeof allowDigits == 'undefined' || allowDigits == null) allowDigits = true;
        if (typeof allowCharacters == 'undefined' || allowCharacters == null) allowCharacters = true;


        var text = "";
        var possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        var possibleDigits = "0123456789";

        var possible = "";

        if (allowDigits) possible += possibleDigits;
        if (allowCharacters) possible += possibleChars;

        for( var i=0; i < size; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }


    function isEmptyOrNil( value ) {
        return _.isNil(value) || _.isEmpty(value)
    }

    _.mixin({randomString: randStr});
    _.mixin({isEmptyOrNil: isEmptyOrNil});


}).call(this);
