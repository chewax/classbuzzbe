(function(){

    var _ = require('lodash');
    var mongoose = require('../../../database').Mongoose;

    module.exports = exports = function localesPlugin (schema, options) {


        var LocaleSchema = new mongoose.Schema({
            lang: {type: String},
            field: {type: String},
            value: {type: String}
        });

        schema.add({ locales: [LocaleSchema] });

        /**
         * Get locale translations for given lang
         * @param lang - locale key: 'es', 'en', 'fr', etc.
         */
        schema.methods.locale = function (lang) {

            var _loc = _.filter(this.locales, {lang:lang});
            var _res = {};

            _loc.forEach(function(l){
                _res[l.field] = l.value;
            });

            return _res;
        };
    }

}).call(this);

