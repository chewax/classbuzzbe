(function(){

    'use strict';

    var pdf = require('phantom-html2pdf');
    var mailplate = require('mailplate.js');
    var fs = require('fs');
    var moment = require('moment');
    var _ = require('lodash');
    var userModel = require('../users/userModel');
    var roleModel = require('../roles/roleModel');

    module.exports.renderReport = function (req, res) {

        getReportData (req.params.name, req.body)
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
                            res.status(200).send(__appRoot + "/lib/public/tmp/" +__pdfName);
                        });
                    });

                });

            })
            .catch(function(err){
                console.log(err);
                res.status(500).json(err);
            });

    };

    function getReportData (reportName, filters) {
        switch (reportName) {
            case "student_house":
                return studentPerHouseReport(filters);
                break;

            case "teacher_students":
                return studentPerTeacherReport(filters);
                break;

            case "all_students":
                return allStudentsReport(filters);
                break;
        }
    }

    function allStudentsReport (filters) {
        return new Promise (function(resolve, reject){

            var _data = {};


            roleModel.findOne({name:'student'})
                .then(function(role){
                    return userModel.find({"customer": filters.customerId})
                        .and({roles:role._id})
                        .populate("customer student.house")
                        .sort({"student.character.xp": -1})
                        .select("firstName lastName email student.character customer student.house")
                })

                .then(function(users){
                    _data.meta = {
                        customerLogo: users[0].customer.logoURL,
                        reportTitle: "All Students Report",
                        reportDescription: "All students from "+ users[0].customer.name
                    }

                    _data.raw = users.map(function(u){

                        return {
                            Name: u.firstName + ' ' + u.lastName,
                            Email: u.email,
                            Score: u.student.character.xp
                        }

                    });

                    resolve(_data)
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
                    console.log(students);

                    _data.meta = {
                        customerLogo: _teacher.customer.logoURL,
                        reportTitle: "Teacher's Students",
                        reportDescription: "All students from teacher: " + _teacher.firstName + " " + _teacher.lastName
                    }

                    _data.raw = students.map(function(s){
                        return {
                            Name: s.firstName + ' ' + s.lastName,
                            Email: s.email,
                            Parent: s.student.parents[0].firstName +" "+ s.student.parents[0].lastName,
                            Score: s.student.character.xp
                        }
                    })

                    resolve(_data);
                })
                .catch(function(err){
                    reject(err);
                });
        });
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

