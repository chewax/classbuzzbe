(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');
    var deepPopulate = require('mongoose-deep-populate')(mongoose);

    require('datejs');

    var groupSchema = new mongoose.Schema({
            name: String,
            level: {type: mongoose.Schema.Types.ObjectId, ref: 'GroupLevel', default: null},
            teacher: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
            customClass: String,
            students: [{type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null}],
            branch: {type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null},
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null},
            subBranch: {type: mongoose.Schema.Types.ObjectId, ref: 'SubBranch', default: null}
        },

        { collection: 'Groups' }
    );

    /**
     * Virtual Attribute to get group attendance
     */
    groupSchema.virtual('attendance', {
        ref: 'Attendance',
        localField: '_id',
        foreignField: 'group'
    });

    //For Virtual Fields
    groupSchema.set('toObject', { virtuals: true });
    groupSchema.set('toJSON', { virtuals: true });


    var options = {
        populate: {
            'students': {select: '-__v -credentials -student.parentalControl -groups -address -isActive -activity'},
            'students.student.house': {select: 'name logo'},
            'students.role': {select: 'name'},
        }
    };

    groupSchema.plugin(deepPopulate, options);
    groupSchema.plugin(mongoosePaginate);

    var Group = mongoose.model('Group', groupSchema);

    module.exports =  Group;

}).call(this);