(function () {
    'use strict';

    var mongoose = require('../../database').Mongoose;
    require('datejs');

    var attendanceSchema = new mongoose.Schema({

            group: {type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null},
            date: {type:Date},
            students: [{
                student: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
                status: {type:String, enum:['present', 'absent', 'late', 'canceled', 'certified'], default:'present'}
            }]
        },

        { collection: 'Attendances' }
    );

    var Attendance = mongoose.model('Attendance', attendanceSchema);
    module.exports =  Attendance;

}).call(this);


