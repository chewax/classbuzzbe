(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');
    require('datejs');

    var statusMailProcessSchema = new mongoose.Schema({
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default:null},
            branch: {type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default:null},
            teacher: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default:null}, //If process is triggered for all teachers students
            group: {type: mongoose.Schema.Types.ObjectId, ref: 'Group', default:null}, //If process is triggered for a teachers group
            timestamp: {type: Date, default: Date.now},
            detail: {type:String, default:"Weekly Newsletter"}
        },

        { collection: 'StatusMailProcess' }
    );

    statusMailProcessSchema.plugin(mongoosePaginate);

    var StatusMailProcess = mongoose.model('StatusMailProcess', statusMailProcessSchema);

    module.exports =  StatusMailProcess;

}).call(this);


