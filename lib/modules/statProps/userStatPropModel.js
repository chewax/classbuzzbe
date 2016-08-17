(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;

    var userStatPropSchema = new mongoose.Schema({
            user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default:null},
            statProp: {type: mongoose.Schema.Types.ObjectId, ref: 'StatProp', default:null},
            value: {type: Number, default: 0}
        },

        { collection: 'UserStatProps' }

    );

    var UserStatProp = mongoose.model('UserStatProp', userStatPropSchema);

    module.exports =  UserStatProp;

}).call(this);
