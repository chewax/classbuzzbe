(function(){
    'use strict';

    String.prototype.capitalize = function() {

        var self = this.toLowerCase();
        var result = self.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
        return result;
    };

    String.prototype.removeChar = function(_char){
        var self = this;
        var result = self.split(_char).join("");
        return result;
    }

    String.prototype.removeInvalidChars = function(){
        var invalidChars = ['&', ' ', '$', '%'];
        var self = this;
        var result = self;

        invalidChars.forEach(function(invalidChar){
            result = result.removeChar(invalidChar);
        });

        return result;
    }

    Number.prototype.between = function (min, max) {
        return this > min && this < max;
    };

}).call(this);
