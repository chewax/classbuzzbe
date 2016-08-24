(function () {
    'use strict';

    var mongoose = require('../../database').Mongoose;

    var errorSchema = new mongoose.Schema({
            user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default:null},
            origin: {type: String, default: "API Backend"},
            status: {type: Number, default:500 },
            message: {type: String, default: null},
            reason: {type: String, default: null},
            timestamp: {type: Date, default: Date.now()},
            stack: {type: String, default: null},
            err: {type: String, default: null}
        },

        { collection: 'Errors' }
    );

    var Error = mongoose.model('Error', errorSchema);
    module.exports =  Error;

}).call(this);



