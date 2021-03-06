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
    var messageModel = require('../messages/messageModel');
    var attendanceModel = require('../attendance/attendanceModel');
    var specialEventsModel = require('../specialEvents/specialEventsModel');
    var mailingUtils = require('./mailingUtils');
    var eh = require('../core/eventsHandler');

    require('datejs');

    module.exports.setMailRecordStatus = setMailRecordStatus;
    module.exports.triggerNewStatusMailProcess = triggerNewStatusMailProcess;
    module.exports.createStudentStatusMail = createStudentStatusMail;
    module.exports.createStudentStatusMailBatch = createStudentStatusMailBatch;

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
                        resolve({messageId:"not found"});
                    }

                    switch (event) {
                        case "delivered":
                            record._delivered = timestamp.format();
                            record.status = "delivered";
                            break;

                        case "opened":
                            record._opened = timestamp.format();
                            record.status = "opened";
                            eh.emit('statusmailopened', record);
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
    function createStudentStatusMail(st, _procId, sendMail, fromDate, toDate){
        
        var _st = st;
        var _teacher_msg_html, _attendance_html, _activities_html, _final_html, _specialEvents_html, _skills_html;

        if (typeof _procId === 'undefined') _procId = null;
        if (typeof sendMail === 'undefined') sendMail = false;
        if (typeof fromDate === 'undefined') fromDate = null;
        if (typeof toDate === 'undefined') toDate = null;

        return renderTeacherMessagesHTML(_st, fromDate, toDate)
            .then( function(html) {
                _teacher_msg_html = html;
                return renderAttendanceHTML(_st, fromDate, toDate);
            })
            .then(function(html){
                _attendance_html = html;
                return renderactivitiesHTML(_st, fromDate, toDate);
            })
            .then(function(html){
                _activities_html = html;
                return renderSpecialEvents(_st, fromDate, toDate);
            })
            .then(function(html){
                _specialEvents_html = html;
                return renderSkillsHTML(_st);
            })
            .then(function(html){
                _skills_html = html;
                return renderFinalHTML(_st, _teacher_msg_html, _activities_html, _attendance_html, _specialEvents_html, _skills_html);
            })
            .then(function(final_html) {
                _final_html = final_html;
                var _subject =  _st.customer.name + ': informe semanal de ' + _st.firstName;
                if (sendMail) return mailingUtils.sendEmailToParents(_st, _final_html, _procId, _subject);
                else return { finalHTML: final_html, subject: _subject }

            })
            .catch(function(err){ errorHandler.handleError(err); })
    }


    /**
     * Receives a fully populated student and creates and sends a status mail to the parents.
     * @param _st {} student
     * @param _procId string Id of the process.
     * @param sendMail bool - if the process has to send the email or just create the html
     */
    function createStudentStatusMailBatch(st, _procId, fromDate, toDate){

        return new Promise(function(resolve, reject){
            

            var _st = st;
            var _teacher_msg_html, _attendance_html, _activities_html, _final_html, _specialEvents_html, _skills_html;

            if (typeof _procId === 'undefined') _procId = null;
            if (typeof sendMail === 'undefined') sendMail = false;
            if (typeof fromDate === 'undefined') fromDate = null;
            if (typeof toDate === 'undefined') toDate = null;

            renderTeacherMessagesHTML(_st, fromDate, toDate)
                .then( function(html) {
                    console.log(html);
                    _teacher_msg_html = html;
                    return renderAttendanceHTML(_st, fromDate, toDate);
                })
                .then(function(html){
                    _attendance_html = html;
                    return renderactivitiesHTML(_st, fromDate, toDate);
                })
                .then(function(html){
                    _activities_html = html;
                    return renderSpecialEvents(_st, fromDate, toDate);
                })
                .then(function(html){
                    _specialEvents_html = html;
                    return renderSkillsHTML(_st);
                })
                .then(function(html){
                    _skills_html = html;

                    var parentFullName = "Padre/Madre";
                
                    if (_st.student.parents[0]) parentFullName = _st.student.parents[0].firstName + " " + _st.student.parents[0].lastName;
                    if (_st.student.parents[1]) parentFullName += " / " + _st.student.parents[1].firstName + " " + _st.student.parents[1].lastName;

                    var templateData = {
                        customer_logo: _st.customer.logoURL,
                        student_first_name: _st.firstName,
                        teacher_messages_html: _mails_html,
                        weekly_activities_html: _activities_html,
                        weekly_attendance_html: _attendance_html,
                        special_events_html: _specialEvents_html,
                        skills_html: _skills_html,
                        parent_full_name:  parentFullName
                    };

                    console.log(templateData);


                    resolve(templateData);

                })
                .catch(function(err){
                    console.log(err);
                    reject(err);
                })
            })
        
    }


    /**
     * Receives a fully populated student and creates the HTML for the special events section of the status mail
     * @param _st
     * @param fromDate
     * @param toDate
     * @returns {Promise}
     */
    function renderSpecialEvents(_st, fromDate, toDate) {

        if (typeof fromDate === 'undefined') fromDate = null;
        if (typeof toDate === 'undefined') toDate = null;


        var andFilters = [];

        if (fromDate != null && toDate != null) {
            andFilters.push({date: {$lte: toDate} });
            andFilters.push({date: {$gte: fromDate} });
        }
        else {
            var lastWeekStarted = moment().startOf('week');
            andFilters.push({date: {$gte: lastWeekStarted} });
        }

        var sEvent_html = "";

        return new Promise (function (resolve, reject){

            specialEventsModel.getActive(_st, fromDate, toDate)
                .then(function(specEvents){

                    if (specEvents.length == 0) {
                        sEvent_html = '<table><thead><tr><th>No hubo ningun evento especial esta semana</th></tr></thead><tbody>';
                        resolve(sEvent_html);
                    }

                    //TODO User i18n for node to get column titles
                    sEvent_html = '<table><thead><tr><th>Evento</th><th>Nota</th><th>Minimo</th><th>Completado</th></tr></thead><tbody>';
                    specEvents.forEach(function(se){
                        sEvent_html += '<tr>';
                        var _userSEIndex = _.findIndex(_st.student.character.specialEvents, function(uSE){
                            return uSE.specialEvent.equals(se._id);
                        });

                        sEvent_html += '<td>';

                        //TODO Use customer configuration locale.
                        var seEvent_es = se.locale('es');

                        if (typeof seEvent_es.name != 'undefined') sEvent_html += seEvent_es.name;
                        else sEvent_html += se.name;
                        sEvent_html += '</td>';

                        sEvent_html += '<td>';
                        sEvent_html += _st.student.character.specialEvents[_userSEIndex].grade + '/5';
                        sEvent_html += '</td>';

                        sEvent_html += '<td>';
                        sEvent_html += se.approvesWith;
                        sEvent_html += '</td>';

                        var localLocale = moment(_st.student.character.specialEvents[_userSEIndex].completed);
                        localLocale.locale('es');

                        sEvent_html += '<td>';
                        sEvent_html += localLocale.format("dddd DD MMMM");
                        sEvent_html += '</td>';

                        sEvent_html += '</tr>';
                    })

                    sEvent_html += '</tbody></table>';
                    resolve(sEvent_html);

                })
                .catch(function(err){
                    reject(err);
                })

        });

    }



    /**
     * Receives a fully populated student and creates the HTML for the skills section
     * @param _st
     * @returns {Promise}
     */
    function renderSkillsHTML(_st) {

        // console.log(_st._id + ": " + _st.firstName + " " + _st.lastName );

        var skills_html = "";
        return new Promise (function (resolve, reject){
        
            _st.student.character.skills.forEach(function(s){

                var max = s.rankInfo.xpToNext;
                var current = s.xp;
                var pj = current * 100 / max;

                skills_html += '<tr>';
                skills_html += '<td>';
                skills_html += '<div id="progress-wrapper">';
                skills_html += '<div id="progress-bar">';
                if (s.skill.name == "Use of English") skills_html += '<div id="progress" class="use_of_english" style="width:'+pj+'%">';
                if (s.skill.name == "Reading") skills_html += '<div id="progress" class="reading" style="width:'+pj+'%">';
                if (s.skill.name == "Speaking") skills_html += '<div id="progress" class="speaking" style="width:'+pj+'%">';
                if (s.skill.name == "Writing") skills_html += '<div id="progress" class="writing" style="width:'+pj+'%">';
                if (s.skill.name == "Listening") skills_html += '<div id="progress" class="listening" style="width:'+pj+'%">';
                if (s.skill.name == "Behaviour") skills_html += '<div id="progress" class="behaviour" style="width:'+pj+'%">';
                skills_html += '<div id="pj">'+ Math.round(pj)+'%'+ '</div>';
                skills_html += '</div>';
                skills_html += '</div>';

                var lIdx = _.findIndex(s.skill.locales, function(l){ return l.field == 'name' && l.lang == 'es' });
                if ( lIdx != -1) skills_html += '<div id="caption">'+ s.skill.locales[lIdx].value +'- Nivel'+ s.rankInfo.rank +'</div>';
                if ( lIdx == -1) skills_html += '<div id="caption">'+ s.skill.name +'- Level'+ s.rankInfo.rank +'</div>';
                
                skills_html += '</div>';
                skills_html += '</td>';
                skills_html += '</tr>';
            })

            resolve(skills_html);
        });

    }

    /**
     * Receives a fully populated student and creates the HTML for the attendance section of the status mail
     * @param st
     * @returns {Promise}
     */
    function renderAttendanceHTML(_st, fromDate, toDate){

        if (typeof fromDate === 'undefined') fromDate = null;
        if (typeof toDate === 'undefined') toDate = null;

        var andFilters = [];

        if (fromDate != null && toDate != null) {
            andFilters.push({date: {$lte: toDate} });
            andFilters.push({date: {$gte: fromDate} });
        }
        else {
            var lastWeekStarted = moment().startOf('week');
            andFilters.push({date: {$gte: lastWeekStarted} });
        }

        //var lastWeekStarted = new Date().addDays(-7);
        var weekDays = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

        return new Promise(function(resolve, reject){

            _st.belongingGroups()
                .then(function(stGroups){
                    return attendanceModel
                        .find({group: {$in: stGroups}})
                        .and(andFilters)
                })
                .then(function(groupAttendance){

                    if (groupAttendance.length == 0) {
                        var attendance_html = '<table><thead><tr><th>No se registraron asistencias esta semana</th></tr></thead><tbody>';
                        resolve(attendance_html);
                    }

                    var weeklyAttendance = groupAttendance.map(function(ga){

                        var stdIdx = _.findIndex(ga.students, function(s){
                            return s.student.toString() == _st._id.toString();
                        });

                        if (stdIdx == -1) {
                            return {date:ga.date, status: "unknown"};
                        }
                        else {
                            return {date:ga.date, status: ga.students[stdIdx].status};
                        }
                        
                    });


                    weeklyAttendance = _.filter(weeklyAttendance, function(wa){
                        return wa.status != 'unknown';
                    })

                    var attendance_html = '<table><thead><tr><th></th><th>Dia</th><th>Asistencia</th></tr></thead><tbody>';
                    var alt =  false;

                    weeklyAttendance.forEach(function(wa){

                        //If status is undefined the student was not part of the group at the moment the attendance was set
                        if (typeof wa.status == 'undefined') return;

                        var statusTranslation = {
                            present:'presente',
                            absent:'ausente',
                            late:'tarde',
                            canceled:'clase cancelada',
                            certified: 'falta justificada'
                        };

                        if (!alt) {
                            attendance_html += '<tr class="'+wa.status+'">';
                        }
                        else attendance_html += '<tr class="alt '+wa.status+'">';


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

                        if (wa.status == 'certified'){
                            attendance_html += '<td class="content-block aligncenter icon">' +
                                '<img src="https://s3-sa-east-1.amazonaws.com/pyromancer.co.gg.images/uploads/absent.png" class="table-icon"/></td><td>';
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
    function renderTeacherMessagesHTML(_st, fromDate, toDate){

        return new Promise(function(resolve, reject){

            if (typeof fromDate === 'undefined') fromDate = null;
            if (typeof toDate === 'undefined') toDate = null;

            var andFilters = [];

            andFilters.push({type: 'statusMail'});
            andFilters.push({dateSent: null});

            if (fromDate != null && toDate != null) {
                andFilters.push({dateQueued: {$lte: toDate} });
                andFilters.push({dateQueued: {$gte: fromDate} });
            }

            messageModel.find({to:_st._id})
                .and(andFilters)
                .then(function(studentMails){

                    if (studentMails.length == 0) {
                        var mails_html = "<table><thead><th>No hay ning&uacute;n mensaje pendiente del profseor</th></thead><tbody>";
                        resolve(mails_html);
                        return;
                    }

                    var alt =  false;
                    var mails_html = "<table><thead><th>Fecha</th><th>Mensaje</th></thead><tbody>";

                    studentMails.forEach(function(sm){

                        if (!alt) mails_html += '<tr><td>';
                        else mails_html += '<tr class="alt"><td>';

                        mails_html += '<span class="from_now">' + sm.dateQueued.toLocaleDateString() + '</span>';
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
    function renderactivitiesHTML(_st, fromDate, toDate) {

        // console.log("Rendering activities");

        return new Promise(function(resolve, reject){

            if (typeof fromDate === 'undefined') fromDate = null;
            if (typeof toDate === 'undefined') toDate = null;

            var weekactivities = [];

            // if date filters are sent, stick to those filters else, last week
            if (fromDate != null && toDate != null) {
                weekactivities = _.filter(_st.student.character.activities, function(a){
                    return ( a.timestamp >= fromDate && a.timestamp <= toDate);
                });
            }
            else {
                // var lastWeekStarted = new Date().addDays(-7);
                var lastWeekStarted = moment().startOf('week');
                weekactivities = _.filter(_st.student.character.activities, function(a){
                    return ( a.timestamp >= lastWeekStarted );
                });
            }

            
            var activity_html = "";

            if (weekactivities.length > 0) {

                var alt =  false;
                activity_html = '<table><thead><tr><th></th><th>Fecha</th><th>Logro</th><th>Recompensa</th></tr></thead><tbody>';

                weekactivities.forEach(function(a){

                    if (a.activity.reward.xp >= 0){

                        if (!alt) {
                            activity_html += '<tr class="reward">';
                        }
                        else activity_html += '<tr class="alt reward">';

                        activity_html += '<td class="content-block aligncenter icon">' +
                            '<img src="https://s3-sa-east-1.amazonaws.com/pyromancer.co.gg.images/uploads/fa-thumbs-o-up_256_0_0cb204_none.png" class="table-icon"/></td><td>';
                    }
                    else {
                        if (!alt) {
                            activity_html += '<tr class="reward">';
                        }
                        else activity_html += '<tr class="alt reward">';

                        activity_html += '<td class="content-block aligncenter icon">' +
                            '<img src="https://s3-sa-east-1.amazonaws.com/pyromancer.co.gg.images/uploads/fa-thumbs-o-down_256_0_e70c0c_none.png" class="table-icon"/></td><td>';
                    }


                    var localLocale = moment(a.timestamp);
                    localLocale.locale('es');
                    activity_html += localLocale.format("dddd DD MMMM");
                    activity_html += '</td><td>';


                    var activity_es = a.activity.locale('es');

                    if (typeof activity_es.name != 'undefined')
                        activity_html += activity_es.name;
                    else
                        activity_html += a.activity.name;

                    activity_html += '</td><td>';
                    activity_html += a.activity.reward.xp +'xp';
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
    function renderFinalHTML(_st, _mails_html, _activities_html, _attendance_html, _specialEvents_html, _skills_html){

        return new Promise(function(resolve, reject){
            
            var parentFullName = "Padre/Madre";
            
            if (_st.student.parents[0]) parentFullName = _st.student.parents[0].firstName + " " + _st.student.parents[0].lastName;
            if (_st.student.parents[1]) parentFullName += " / " + _st.student.parents[1].firstName + " " + _st.student.parents[1].lastName;

            var templateData = {
                customer_logo: _st.customer.logoURL,
                student_first_name: _st.firstName,
                teacher_messages_html: _mails_html,
                weekly_activities_html: _activities_html,
                weekly_attendance_html: _attendance_html,
                special_events_html: _specialEvents_html,
                skills_html: _skills_html,
                parent_full_name:  parentFullName
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
                .populate('student', 'firstName lastName email avatarURL student.parents')
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
                populate: {path:'student', select:'doc firstName lastName email student.parents'},
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
                            userModel.findStudentTeachers(m.student._id)
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
                        process: { $first: "$process" },
                        sent: { $sum: 1 },
                        opened: { $sum : { $cond: [{$eq: ["$status", "opened"]}, 1, 0] } },
                        delivered: { $sum : { $cond: [{$ne: ["$_delivered", null]}, 1, 0] } },
                        errors: { $sum : { $cond: [{$eq: ["$_delivered", null ]}, 1, 0] } }
                    }
                });

            aggregatePipeline.push({ $sort: {"date": -1} });

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
                        mailingModel.populate(result, {path: 'process'}, function(err, populatedRecords) {
                            var resObj = [];
                            resObj[0] = populatedRecords;
                            resObj[1] = totalPages;
                            resObj[2] = numberOfRecords;

                            res.status(200).json(resObj);
                        });
                    }

                    else errorHandler.handleError(err, req, res);
                })

            });

        }
    }

}).call(this);
