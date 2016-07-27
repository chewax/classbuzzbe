(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;

    var roleSchema = new mongoose.Schema({
            name: {type:String, unique:true},
            tier: Number,
            mayGrant: [{type: mongoose.Schema.Types.ObjectId, ref: 'Role'}]
        },

        { collection: 'Roles' }

    );

    var Role = mongoose.model('Role', roleSchema);

    module.exports =  Role;

}).call(this);