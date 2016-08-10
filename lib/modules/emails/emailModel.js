(function () {
    'use strict';

    var mongoose = require('../../database').Mongoose;
    var moment = require('moment');

    //TODO Refactor Model Change Name to something more accurate...
    // this is p2p communication amongst the teacher and a student's parent/tutor
    var mailSchema = new mongoose.Schema({
            from: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default:null},
            to: [{type: mongoose.Schema.Types.ObjectId, ref: 'User', default:null}], //Holds the user to whose parent should the message be sent.
            to_groups: [{type: mongoose.Schema.Types.ObjectId, ref: 'Group', default:null}],
            to_branch: [{type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default:null}],
            subject: {type: String, default: null},
            body: {type: String, default: null},
            dateQueued: {type: Date},
            dateSent: {type: Date, default: null},
            dateReceived: {type: Date, default: null},
            dateRead: {type:Date, default: null},
            status: {type: String, enum: ['ready', 'sent', 'received', 'read'], default:'ready' },
            archived: {type: Boolean, default: false}
        },

        { collection: 'Mails' }
    );

    mailSchema.pre('save',function(next){
        var self = this;
        self.dateQueued = moment();
        next();
    })

    var Mail = mongoose.model('Mail', mailSchema);
    module.exports =  Mail;

}).call(this);


