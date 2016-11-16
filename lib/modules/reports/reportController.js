(function(){

    'use strict';

    var pdf = require('phantom-html2pdf');
    var mailplate = require('mailplate.js');
    var fs = require('fs');
    var moment = require('moment');
    var _ = require('lodash');
    var userModel = require('../users/userModel');
    var roleModel = require('../roles/roleModel');
    var attendanceModel = require('../attendance/attendanceModel');
    var config = require('../../config');

    module.exports.renderReport = function (req, res) {

        getReportData (req.body)
            .then(function (_data) {

                var reportTable = createReportTable(_data.raw);

                return mailplate.renderAsync('/lib/templates/reports/reports.html',
                    {
                        report_table: reportTable,
                        customer_logo: _data.meta.customerLogo,
                        report_title: _data.meta.reportTitle,
                        report_description: _data.meta.reportDescription
                    })
            })
            .then(function(resHTML){

                var __appRoot = process.cwd();
                var __baseName = moment().unix() + "_" + _.randomString(5);
                var __htmlName = __baseName +".html";
                var __pdfName = __baseName +".pdf";

                if (!fs.existsSync(__appRoot + "/lib/public/tmp/")) fs.mkdirSync(__appRoot + "/lib/public/tmp/");

                    fs.writeFile(__appRoot + "/lib/public/tmp/" + __htmlName, resHTML , function(err) {
                    if(err) return console.log(err);

                    var options = {
                        html: __appRoot + "/lib/public/tmp/" + __htmlName,
                        paperSize: {
                            format: 'A4',
                            orientation: 'landscape',
                            border: '1cm',
                            delay: 6000
                        },
                        deleteOnAction: true
                    };

                    pdf.convert(options, function(err, result) {
                        result.toFile(__appRoot + "/lib/public/tmp/" +__pdfName, function() {

                            var _data = {
                                reportURL: config.baseURL + "/tmp/" +__pdfName
                            };
                            
                            res.status(200).json(_data);
                        });
                    });

                });

            })
            .catch(function(err){
                console.log(err);
                res.status(500).json(err);
            });

    };

    function getReportData (filters) {
        switch (filters.name) {
            case "student_house":
                return studentPerHouseReport(filters);
                break;

            case "teacher_students":
                return studentPerTeacherReport(filters);
                break;

            case "all_students":
                return allStudentsReport(filters);
                break;

            case "student_attendance_year":
                return studentAttendanceYearlyReport(filters);
                break;

            case "student_attendance_month":
                return studentAttendanceMonthlyReport(filters);
                break;

            case "all_attendance_month":
                return allAttendanceMonthlyReport(filters);
                break;
        }
    }

    function allStudentsReport (filters) {
        return new Promise (function(resolve, reject){

            var _data = {};
            var _promises = [];

            roleModel.findOne({name:'student'})
                .then(function(role){
                    return userModel.find({"customer": filters.customer})
                        .and({roles:role._id})
                        .populate("customer student.house")
                        .sort({"student.character.xp": -1})
                        .select("firstName lastName email student.character customer student.house")
                })

                .then(function(users){

                    _data.meta = {
                        customerLogo: users[0].customer.logoURL,
                        reportTitle: "All Students Report",
                        reportDescription: "All "+ users[0].customer.name +" students"
                    };

                    _data.raw = [];

                    users.forEach(function(u){
                        _promises.push(
                            u.userGroupLevel({toString:true} )
                                .then(function(level){
                                    _data.raw.push({
                                        Level: level,
                                        Name: u.firstName + ' ' + u.lastName,
                                        Email: u.email,
                                        Score: u.student.character.xp
                                    })
                                })
                        );
                    });

                    return Promise.all(_promises);
                })
                .then(function(result){
                    _data.raw = _.sortBy(_data.raw, ["Level", "Name"]);
                    resolve( _data );
                })
                .catch(function(err){
                    reject(err);
                });
        });
    }

    function studentPerHouseReport (filters) {
        return new Promise (function(resolve, reject){

            var _data = {};
            userModel.find({"student.house": filters.houseId})
                .populate("customer student.house")
                .sort({"student.character.xp": -1})
                .select("firstName lastName email student.character.xp customer student.house")
                .then(function(users){
                    _data.meta = {
                        customerLogo: users[0].customer.logoURL,
                        reportTitle: "Students Per House Report",
                        reportDescription: "All students from "+ users[0].student.house.name +" House"
                    }

                    _data.raw = users.map(function(u){
                        return {
                            Name: u.firstName + ' ' + u.lastName,
                            Email: u.email,
                            Score: u.student.character.xp
                        }
                    })

                    resolve(_data)
                })
                .catch(function(err){
                    reject(err);
                });
        });
    }

    function studentPerTeacherReport (filters) {
        return new Promise (function(resolve, reject){

            var _data = {};
            var _teacher = {};

            userModel.findOne({_id:filters.teacherId})
                .populate('customer')
                .then(function(teacher){
                    _teacher = teacher;
                    return userModel.findTeacherStudents(filters.teacherId)
                })
                .then(function(students){

                    _data.meta = {
                        customerLogo: _teacher.customer.logoURL,
                        reportTitle: "Teacher's Students",
                        reportDescription: "All students from teacher: " + _teacher.firstName + " " + _teacher.lastName
                    };

                    _data.raw = students.map(function(s){

                        var _raw = {
                            Level: s.level.code,
                            Name: s.firstName + ' ' + s.lastName,
                            Email: s.email,
                            Parent: "",
                            Score: s.student.character.xp
                        };

                        if ( !_.isNil(s.student.parents[0])) _raw.Parent = s.student.parents[0].firstName +" "+ s.student.parents[0].lastName;

                        return _raw;
                    });


                    _data.raw = _.sortBy(_data.raw, ["Level", "Name"]);
                    resolve( _data );

                })
                .catch(function(err){
                    reject(err);
                });
        });
    }


    function allAttendanceMonthlyReport (filters) {

        return new Promise (function(resolve, reject){

            var promises = [];
            var targetYear = filters.year;
            var targetMonth = filters.month;

            if (typeof targetYear == "undefined" || targetYear == null) targetYear = moment().year();
            if (typeof targetMonth == "undefined" || targetMonth == null) targetMonth = moment().month();

            var targetMoment = moment().year(targetYear).month(targetMonth);

            var _data = {
                raw: [],
                meta: {}
            };

            roleModel.findOne({name:'student'})
                .then(function(role){
                    return userModel.find({"customer": filters.customer})
                        .and({roles:role._id})
                        .populate("customer student.house groupsBelonging")
                        .sort({lastName:1, firstName:1})
                        .select("doc firstName lastName email student customer groupsBelonging")
                })
                .then(function(sts) {

                    _data.meta = {
                        customerLogo: sts[0].customer.logoURL,
                        reportTitle: "All Students Attendance Report",
                        reportDescription: "(" + targetMoment.format('MMMM') + ")"
                    };

                    var from = targetMoment.clone().startOf('month');
                    var to = targetMoment.clone().endOf('month');


                    sts.forEach(function (_st) {

                        promises.push (

                            attendanceModel.find({group: {$in: _st.groupsBelonging}})
                                .and([{date: {$gt: from}}, {date: {$lt: to}}])
                                .then(function(groupAttendance) {

                                    var mappedAttendance = groupAttendance.map(function(ga){

                                        var studentData = _.find(ga.students, function(s){
                                            return s.student.toString() == _st._id.toString();
                                        });

                                        if (typeof studentData == 'undefined') studentData = {status:"absent"};
                                        return {date:ga.date, status: studentData.status};
                                    });

                                    var _tmp = {
                                        Name: "",
                                        Present: 0,
                                        Absent: 0,
                                        Late: 0,
                                        Canceled: 0
                                    };

                                    mappedAttendance.forEach(function(att){
                                        _tmp[att.status.capitalize()] += 1;
                                    });

                                    _tmp.Name = _st.lastName + ", " + _st.firstName;
                                    _data.raw.push(_tmp);

                                })
                                .catch(function(err){
                                    reject(err);
                                })
                        )
                    });

                    return Promise.all(promises);

                })
                .then(function(result){
                    resolve(_data);
                })
                .catch(function(err){
                    reject(err);
                })

        })

    }

    function studentAttendanceYearlyReport (filters) {

        return new Promise (function(resolve, reject){

            var _st;
            var targetYear = filters.year;
            if (typeof targetYear == "undefined" || targetYear == null) targetYear = moment().year();

            var _data = {
                raw: [],
                meta: {}
            };

            //TODO Use customer locale config
            var months = moment().forLocale('en', moment.months);

            for (var i = 0; i < 12; i++) {
                _data.raw[i] = {
                    Month: months[i],
                    Present: 0,
                    Absent: 0,
                    Late: 0,
                    Canceled: 0
                }
            }

            userModel.findOne({_id:filters.studentId})
                .populate('customer groupsBelonging')
                .then(function(st){
                    _st = st;

                    _data.meta = {
                        customerLogo: st.customer.logoURL,
                        reportTitle: "Student Attendance Report",
                        reportDescription: st.firstName + " " + st.lastName + " (" + targetYear + ")"
                    };

                    var from = moment().year(targetYear).startOf('year');
                    var to = moment().year(targetYear).endOf('year');

                    return attendanceModel.find({group: {$in: st.groupsBelonging}})
                        .and([{date: {$gt: from}}, {date: {$lt: to}}])
                })
                .then(function(groupAttendance){

                    var mappedAttendance = groupAttendance.map(function(ga){

                        var studentData = _.find(ga.students, function(s){
                            return s.student.toString() == _st._id.toString();
                        });

                        if (typeof studentData == 'undefined') studentData = {status:"absent"};
                        return {date:ga.date, status: studentData.status};
                    });

                    mappedAttendance.forEach(function(att){
                        att.month = new Date(att.date).getMonth();
                        _data.raw[att.month - 1][att.status.capitalize()] += 1;
                    });

                    resolve(_data);

                })
                .catch(function(err){
                    reject(err);
                })

        })

    }

    function studentAttendanceMonthlyReport (filters) {

        return new Promise (function(resolve, reject){

            var _st;
            var targetYear = filters.year; //2016
            var targetMonth = filters.month; //0-11

            if (typeof targetYear == "undefined" || targetYear == null) targetYear = moment().year();
            if (typeof targetMonth == "undefined" || targetMonth == null) targetMonth = moment().month();

            var targetMoment = moment().year(targetYear).month(targetMonth);

            var _data = {
                raw: [],
                meta: {}
            };

            userModel.findOne({_id:filters.studentId})
                .populate('customer groupsBelonging')
                .then(function(st){
                    _st = st;

                    _data.meta = {
                        customerLogo: st.customer.logoURL,
                        reportTitle: "Student Attendance Report",
                        reportDescription: st.firstName + " " + st.lastName + " (" + targetMoment.format('MMMM') + ")"
                    };

                    var from = targetMoment.clone().startOf('month');
                    var to = targetMoment.clone().endOf('month');

                    return attendanceModel.find({group: {$in: st.groupsBelonging}})
                        .and([{date: {$gt: from}}, {date: {$lt: to}}])
                })
                .then(function(groupAttendance){

                    groupAttendance.map(function(ga, idx, arr){

                        var studentData = _.find(ga.students, function(s){
                            return _st._id.equals(s.student);
                        });

                        if (typeof studentData == 'undefined') studentData = {status:"absent"};

                        var info = {
                            "#": moment(ga.date).format('DD'),
                            Day: moment(ga.date).format('dddd'),
                            Status: studentData.status
                        };

                        _data.raw.splice(idx, 0 ,info);
                    });

                    resolve(_data);
                })
                .catch(function(err){
                    reject(err);
                })

        })

    }

    /**
     * Creates report table html based on _data object
     * @param _data
     * @returns {string}
     */
    function createReportTable (_data) {
        var _html = "";

        _html += "<table>";
        _html += "<thead>";
            for (var key in _data[0]) {
                _html += "<th>";
                _html += key;
                _html += "</th>";
            }
        _html += "</thead>";
        _html += "<tbody>";
            for (var i=0; i<_data.length; i++) {
                _html += "<tr>";
                for (var key in _data[i]) {
                    _html += "<td>";
                    _html += _data[i][key];
                    _html += "</td>";
                }
                _html += "</tr>";
            }
        _html += "</tbody>";
        _html += "</table>";

        return _html;
    }

}).call(this);

