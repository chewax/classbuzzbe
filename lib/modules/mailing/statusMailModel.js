(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');
    require('datejs');

    var statusMailSchema = new mongoose.Schema({
            messageId: {type: String, index:true}, //Mailgun Generated
            to: {type: String},
            process: {type: mongoose.Schema.Types.ObjectId, ref: 'StatusMailProcess', default:null},
            student: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default:null},
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default:null},
            branch: {type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default:null},
            status: {type: String, enum:['sent','delivered','opened','dropped','bounced'], default:'sent'},
            _created: {type: Date, default: Date.now},
            _delivered: {type: Date, default: null},
            _opened: {type: Date, default: null}
        },

        { collection: 'StatusMails' }
    );

    statusMailSchema.plugin(mongoosePaginate);

    var StatusMail = mongoose.model('StatusMail', statusMailSchema);

    module.exports =  StatusMail;

}).call(this);

