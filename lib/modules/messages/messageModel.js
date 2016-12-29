(function () {
    'use strict';

    var mongoose = require('../../database').Mongoose;
    var moment = require('moment');

    var messageSchema = new mongoose.Schema({
            from: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default:null},
            to: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default:null}, //Holds the user to whose parent should the message be sent.

            body: {type: String, default: null},

            dateQueued: {type: Date},
            dateSent: {type: Date, default: null},
            dateReceived: {type: Date, default: null},
            dateRead: {type:Date, default: null},

            status: {type: String, enum: ['ready', 'sent', 'received', 'read'], default:'ready' },
            origin: {type: String, enum: ['p2p', 'statusMail'], default:'p2p' }
        },

        { collection: 'Messages' }
    );

    messageSchema.pre('save',function(next){
        var self = this;
        self.dateQueued = moment();
        next();
    })

    var Message = mongoose.model('Message', messageSchema);
    module.exports =  Message;

}).call(this);


