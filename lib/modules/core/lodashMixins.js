(function(){

    var _ = require('lodash');

    /**
     * Generates a Random string of length == size
     * @param size
     * @returns {string}
     */
    function randStr(size) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

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
