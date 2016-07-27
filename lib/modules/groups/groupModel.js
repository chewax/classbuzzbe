(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');
    var deepPopulate = require('mongoose-deep-populate')(mongoose);

    require('datejs');

    var groupSchema = new mongoose.Schema({
            name: String,
            level: {type: mongoose.Schema.Types.ObjectId, ref: 'GroupLevel', default: null},
            customClass: String,
            students: [{type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null}],
            branch: {type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null},
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null},
            subBranch: {type: mongoose.Schema.Types.ObjectId, ref: 'SubBranch', default: null}
        },

        { collection: 'Groups' }
    );

    groupSchema.statics.addUser = function(groupId, userId){
        this.findOne({_id:groupId})
            .then(function(group){

                var index = group.students.indexOf(userId);
                if (index == -1) {
                    group.students.push(userId);
                    return group.save();
                }

            })
    };

    groupSchema.statics.removeUser = function(groupId, userId){
        this.findOne({_id:groupId})
            .then(function(group){

                var index = group.students.indexOf(userId);
                if (index != -1) {
                    group.students.splice(index,1);
                    return group.save();
                }

            })
    };


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