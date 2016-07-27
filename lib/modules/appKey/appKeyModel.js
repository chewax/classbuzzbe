(function () {
    'use strict';

    var crypto = require('crypto');
    var mongoose = require('../../database').Mongoose;

    var appKeySchema = new mongoose.Schema({
            name: {type:String, unique: true},
            key: {type:String, unique: true},
            created: { type : Date, default: Date.now },
            isActive: { type: Boolean, default: true }
        },

        { collection: 'AppKeys' }
    );

    // Generate new AppKey upon save.
    appKeySchema.pre('save', function (next) {
        var that = this;
        crypto.randomBytes(20, function(err, buf){
            if (err)
            {
                next(err);
            }
            else
            {
                that.key = buf.toString('hex');
                next();
            }
        });
    })
    
    var AppKey = mongoose.model('AppKey', appKeySchema);
    module.exports =  AppKey;

}).call(this);

