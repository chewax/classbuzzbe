(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    var statPropSchema = new mongoose.Schema({
            name: {type: String},
            initialValue: {type: Number, default: 0}
        },

        { collection: 'StatProps' }
    );

    statPropSchema.statics.findOneOrCreate = function(conditions, document, callback) {

        if(typeof callback == 'function') {
            StatProp.findOne(conditions, function(err, result) {
                if(result != null) {
                    callback(err, result);
                }
                else {
                    StatProp.create(document, function(err, result){
                        callback(err, result);
                    })
                }
            })
        }
        else {
            return new Promise(function(resolve, reject) {
                StatProp.findOne(conditions, function(err, result) {

                    if(err) reject(err);

                    if(result != null) {
                        resolve(result);
                    }
                    else {
                        StatProp.create(document, function(err, result){
                            resolve(result);
                        })
                    }
                })
            })
        }
    };

    statPropSchema.plugin(mongoosePaginate);

    var StatProp = mongoose.model('StatProp', statPropSchema);

    module.exports = StatProp;

}).call(this);
