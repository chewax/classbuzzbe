(function () {
    'use strict';

    var logger = require('../log/logger').getLogger();
    var moment = require('moment-timezone');
    var mailingModel = require('./statusMailModel');
    var errorHandler = require('../errors/errorHandler');
    var customErr = require('./../errors/customErrors');
    var mongoose = require('../../database').Mongoose;
    var _ = require("lodash");
    var userModel = require('../users/userModel');
    var mailplate = require('mailplate.js');
    var config = require('../../config');
    var roleModel = require('../roles/roleModel');
    var branchModel = require('../branches/branchModel');
    var customerModel = require('../customers/customerModel');
    var emailModel = require('../emails/emailModel');
    var attendanceModel = require('../attendance/attendanceModel');
    var mailingUtils = require('./mailingUtils');

    require('datejs');

    module.exports.setMailRecordStatus = setMailRecordStatus;
    module.exports.triggerNewStatusMailProcess = triggerNewStatusMailProcess;
    module.exports.createStudentStatusMail = createStudentStatusMail;


    /**
     * Changes a MailRecord status and sets corresponding timestamp.
     * @param messageId
     * @param event
     * @param timestamp
     * @returns {Promise}
     */
    function setMailRecordStatus(messageId, event, timestamp){
        return new Promise(function(resolve, reject){
            mailingModel.findOne({messageId:messageId})
                .then(function(record){

                    if (_.isEmpty(record) || record == null) {
                        var e = new customErr.mildError("Mail Record Not Found");
                        throw e;
                    }

                    switch (event) {
                        case "delivered":
                            record._delivered = timestamp.format();
                            record.status = "delivered";
                            break;

                        case "opened":
                            record._opened = timestamp.format();
                            record.status = "opened";
                            break;

                        case "dropped":
                            record.status = "dropped";
                            break;

                        case "bounced":
                            record.status = "bounced";
                            break;
                    }

                    return record.save();

                })
                .then(function(result){
                    resolve(result);
                })
                .catch(function(err){
                    reject(err);
                })
        })
    };


    /**
     * Triggers a new status mail process for passed branch & customer. Branch is optional.
     * If no branch is passed then the process is triggered for all customer branches.
     * Customer is optional. If no customer is passed then the process is triggered for all customers.
     * @param [_customer]
     * @param [_branch]
     */
    function triggerNewStatusMailProcess(_customer, _branch){
        mailingUtils.triggerNewMailProcess(_customer, _branch, null, null, "Weekly Newsletter", createStudentStatusMail)
    }

    /**
     * Receives a fully populated student and creates and sends a status mail to the parents.
     * @param _st {} student
     * @param _procId string Id of the process.
     * @param sendMail bool - if the process has to send the email or just create the html
     */
    function createStudentStatusMail(st, _procId, sendMail){

        var _st = st;
        var _teacher_msg_html, _attendance_html, _activities_html, _final_html;

        if (typeof _procId === 'undefined') _procId = null;
        if (typeof sendMail === 'undefined') sendMail = false;

        return renderTeacherMessagesHTML(_st)
            .then( function(html) {
                _teacher_msg_html = html;
                return renderAttendanceHTML(_st);
            })
            .then(function(attendance_html){
                _attendance_html = attendance_html;
                return renderactivitiesHTML(_st);
            })
            .then(function(activities_html){
                _activities_html = activities_html;
                return renderFinalHTML(_st, _teacher_msg_html, _activities_html, _attendance_html);
            })
            .then(function(final_html) {
                _final_html = final_html;
                var _subject =  '[Class Buzz] - ' + _st.customer.name + ': informe semanal de ' + _st.firstName;
                if (sendMail) return mailingUtils.sendEmailToParents(_st, _final_html, _procId, _subject);
                else return { finalHTML: final_html, subject: _subject }

            })
            .catch(function(err){ errorHandler.handleError(err); })
    }

    /**
     * Receives a fully populated student and creates the HTML for the attendance section of the status mail
     * @param st
     * @returns {Promise}
     */
    function renderAttendanceHTML(_st){

        var lastWeekStarted = new Date().addDays(-7);
        var weekDays = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

        return new Promise(function(resolve, reject){

            attendanceModel.find({group: {$in: _st.groups}})
                .and({date: {$gt: lastWeekStarted}})
                .then(function(groupAttendance){

                    if (groupAttendance.length == 0) {
                        var attendance_html = '<table><thead><tr><th></th><th>No se registraron asistencias esta semana</th></tr></thead><tbody>';
                        resolve(attendance_html);
                    }

                    var weeklyAttendance = groupAttendance.map(function(ga){

                        var studentData = _.find(ga.students, function(s){
                            return s.student.toString() == _st._id.toString();
                        });

                        return {date:ga.date, status: studentData.status};

                    });

                    var attendance_html = '<table><thead><tr><th></th><th>Dia</th><th>Asistencia</th></tr></thead><tbody>';
                    var alt =  false;

                    weeklyAttendance.forEach(function(wa){

                        //If status is undefined the student was not part of the group at the moment the attendance was set
                        if (typeof wa.status == 'undefined') return;

                        var statusTranslation = {
                            present:'presente',
                            absent:'ausente',
                            late:'tarde',
                            canceled:'clase cancelada'
                        };

                        if (!alt) {
                            attendance_html += '<tr class="'+wa.status+'">';
                        }
                        else attendance_html += '<tr class="alt '+wa.status+'">';1


                        if (wa.status == 'present'){
                            attendance_html += '<td class="content-block aligncenter icon">' +
                                '<img src="https://s3-sa-east-1.amazonaws.com/pyromancer.co.gg.images/uploads/present.png" class="table-icon"/></td><td>';
                        }

                        if (wa.status == 'absent'){
                            attendance_html += '<td class="content-block aligncenter icon">' +
                                '<img src="https://s3-sa-east-1.amazonaws.com/pyromancer.co.gg.images/uploads/absent.png" class="table-icon"/></td><td>';
                        }

                        if (wa.status == 'late'){
                            attendance_html += '<td class="content-block aligncenter icon">' +
                                '<img src="https://s3-sa-east-1.amazonaws.com/pyromancer.co.gg.images/uploads/late.png" class="table-icon"/></td><td>';
                        }

                        if (wa.status == 'canceled'){
                            attendance_html += '<td class="content-block aligncenter icon">' +
                                '<img src="https://s3-sa-east-1.amazonaws.com/pyromancer.co.gg.images/uploads/canceled.png" class="table-icon"/></td><td>';
                        }

                        attendance_html += weekDays[wa.date.getDay()] + ' ' + wa.date.getDate();
                        attendance_html += '</td><td>';

                        attendance_html += statusTranslation[wa.status];
                        attendance_html += '</td></tr>';
                        alt = !alt;

                    });

                    attendance_html += '</tbody></table>';
                    resolve(attendance_html);
                })
                .catch(function(err){
                    reject(err);
                })
        });


    }

    /**
     * Receives a fully populated student and creates the HTML for the teacher messages section of the status mail
     * @param st
     * @returns {Promise}
     */
    function renderTeacherMessagesHTML(_st){

        return new Promise(function(resolve, reject){

            emailModel.find({to:_st._id})
                .and({status:'ready'})
                .then(function(studentMails){

                    if (studentMails.length == 0) {
                        var mails_html = "<table><thead><th>No hay ning&uacute;n mensaje pendiente del profseor</th></thead><tbody>";
                        resolve(mails_html);
                        return;
                    }

                    var alt =  false;
                    var mails_html = "<table><thead><th>Fecha</th><th>Asunto</th><th>Mensaje</th></thead><tbody>";

                    studentMails.forEach(function(sm){

                        if (!alt) mails_html += '<tr><td>';
                        else mails_html += '<tr class="alt"><td>';

                        mails_html += '<span class="from_now">' + sm.dateQueued.toLocaleDateString() + '</span>';
                        mails_html += '</td><td>';
                        mails_html += sm.subject;
                        mails_html += '</td><td>';
                        mails_html += sm.body;
                        mails_html += '</td></tr>';

                        alt = !alt;

                        sm.status = 'sent';
                        sm.dateSent = new Date();
                        sm.save();
                    });

                    mails_html += "</tbody></table>";
                    resolve(mails_html);
                })
                .catch(function(err){
                    reject(err);
                });
        });

    }

    /**
     * Receives a fully populated student and creates the HTML for the weekly activities section of the status mail
     * @param _st
     * @returns {Promise}
     */
    function renderactivitiesHTML(_st) {

        return new Promise(function(resolve, reject){

            var lastWeekStarted = new Date().addDays(-7);
            var weekactivities = _.filter(_st.student.character.activities, function(a){
                return a.timestamp >= lastWeekStarted;
            });

            var activity_html = "";

            if (weekactivities.length > 0) {

                var alt =  false;
                activity_html = '<table><thead><tr><th></th><th>Logro</th><th>Recompensa</th></tr></thead><tbody>';

                weekactivities.forEach(function(a){

                    if (!alt) {
                        activity_html += '<tr class="'+ a.activity.type +'">';
                    }
                    else activity_html += '<tr class="alt '+ a.activity.type +'">';

                    if (a.activity.type == 'reward'){
                        activity_html += '<td class="content-block aligncenter icon">' +
                            '<img src="https://s3-sa-east-1.amazonaws.com/pyromancer.co.gg.images/uploads/fa-thumbs-o-up_256_0_0cb204_none.png" class="table-icon"/></td><td>';
                    }
                    else {
                        activity_html += '<td class="content-block aligncenter icon">' +
                            '<img src="https://s3-sa-east-1.amazonaws.com/pyromancer.co.gg.images/uploads/fa-thumbs-o-down_256_0_e70c0c_none.png" class="table-icon"/></td><td>';
                    }

                    if (typeof a.activity.nameTranslation != 'undefined')
                        activity_html += a.activity.name + '/' + a.activity.nameTranslation;
                    else
                        activity_html += a.activity.name;

                    activity_html += '</td><td>';
                    activity_html += a.activity.xpAward +'xp';
                    activity_html += '</td></tr>';
                    alt = !alt;
                });

                activity_html += '</tbody></table>';
            }

            else {

                activity_html += '<table><thead><tr><th>No recibi&oacute; ning&uacute;n m&eacute;rito esta semana</th></tr></thead><tbody>';
            }


            resolve(activity_html);
        });

    }

    /**
     * Receives a student and all previously generated HTML sections and compiles into final status mail HTML
     * @param _st
     * @param _mails_html
     * @param _activities_html
     * @param _attendance_html
     * @returns {*}
     */
    function renderFinalHTML(_st, _mails_html, _activities_html, _attendance_html){

        return new Promise(function(resolve, reject){
            var templateData = {
                customer_logo: _st.customer.logoURL,
                student_first_name: _st.firstName,
                teacher_messages_html: _mails_html,
                weekly_activities_html: _activities_html,
                weekly_attendance_html: _attendance_html
            };

            mailplate.renderAsync('/lib/templates/inlined/parentNewsletter.html', templateData)
                .then(function(resHTML){
                    resolve(resHTML);
                })
                .catch(function(err){
                    reject(err);
                })
        });

    }
    
    module.exports.api = {

        /**
         * Gets all mails sent in a date. If date is null, returns all mails
         * @param req
         * @param res
         * @data {
         *  date: Date
         * }
         */
        getAllRecords: function(req, res) {

            mailingModel.find({_created:req.params.date})
                .populate('student', 'firstName lastName email avatarURL student.parent student.parent2')
                .then(function(result){
                    res.status(200).json(result);
                })
                .catch(function(err){
                    errorHandler.handleError(err, req, res);
                })
        },

        /**
         * Gets all mails sent in a process.
         * @param req
         * @param res
         * @data {
         *  process: _id
         * }
         */
        paginateRecords: function(req, res) {

            var pagOptions = {
                page: req.body.page || 1,
                limit: req.body.limit || 10,
                lean: true,
                populate: {path:'student', select:'doc firstName lastName email student.parent student.parent2'},
                status: req.body.searchFilters.status
            };

            var andFilters = [];
            andFilters.push({process:req.params.id});
            if (typeof pagOptions.status != "undefined" && pagOptions.status != null && pagOptions.status != "" ) andFilters.push({status:pagOptions.status});

            var promises = [];
            var records = [];
            var baseResult;

            mailingModel.paginate({$and: andFilters }, pagOptions)
                .then(function(result){

                    baseResult = result;
                    records[0] = [];

                    result[0].forEach(function(m){

                        if (m.student == null) {
                            return;
                        }

                        promises.push(
                            userModel.findStudentTeachers(m.student.doc)
                                .then(function(_teachers){
                                    var _m = JSON.parse(JSON.stringify(m));
                                    _m.teachers = _teachers;
                                    records[0].push(_m);
                                })
                            );
                    });

                    return Promise.all(promises);
                })
                .then(function(result){

                    records[1] = baseResult[1];
                    records[2] = baseResult[2];

                    res.status(200).json(records);
                })
                .catch(function(err){
                    errorHandler.handleError(err, req, res);
                })
        },

        /**
         * Returns Every Date that has a process triggered
         * @param req
         * @param res
         */
        getRecordDates: function(req, res){

            var pagOptions = {
                page: req.body.page || 1,
                limit: req.body.limit || 10,
                branch: req.body.searchFilters.branch,
                customer: req.body.searchFilters.customer
            };

            var andFilters = [];
            var aggregatePipeline = [];

            //ADD AND FILTERS
            if (mongoose.Types.ObjectId.isValid(pagOptions.branch)) andFilters.push({branch: mongoose.Types.ObjectId(pagOptions.branch)});
            if (mongoose.Types.ObjectId.isValid(pagOptions.customer)) andFilters.push({customer: mongoose.Types.ObjectId(pagOptions.customer)});

            andFilters.push({process: {$exists:true}});

            //ADD PIPELINE OPERATORS
            if (andFilters.length > 0) aggregatePipeline.push({$match:{$and:andFilters}});
            aggregatePipeline.push(
                {
                    $group: {
                        _id: "$process",
                        date: { $first: "$_created" },
                        sent: { $sum: 1 },
                        opened: { $sum : { $cond: [{$eq: ["$status","opened"]}, 1, 0] } },
                        delivered: { $sum : { $cond: [{$ne: ["$_delivered", null]}, 1, 0] } },
                        errors: { $sum : { $cond: [{$eq: ["$_delivered", null ]}, 1, 0] } }
                    }
                });

            //FIRST AGGREGATION TO CALCULATE THE PAGES
            mailingModel.aggregate( aggregatePipeline ,function(err, result){

                if (err) {
                    errorHandler.handleError(err, req, res);
                    return;
                }

                var numberOfRecords = result.length;
                var totalPages = Math.ceil(numberOfRecords/pagOptions.limit);

                aggregatePipeline.push({ $skip: ((pagOptions.page - 1) * pagOptions.limit) });
                aggregatePipeline.push({ $limit: pagOptions.limit });

                // SECOND AGGREGATION TO RETURN THE DATA
                mailingModel.aggregate(aggregatePipeline, function(err, result){
                    if (!err) {

                        var resObj = [];
                        resObj[0] = result;
                        resObj[1] = totalPages;
                        resObj[2] = numberOfRecords;

                        res.status(200).json(resObj);
                    }
                    else errorHandler.handleError(err, req, res);
                })

            });

        }
    }

}).call(this);
