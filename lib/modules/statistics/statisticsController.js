(function () {
    'use strict';

    var Events = require('../events/eventModel');
    var Attendance = require('../attendance/attendanceModel');
    var User = require('../users/userModel');
    var Role = require('../roles/roleModel');

    var mongoose = require('../../database').Mongoose;
    var errorHandler = require('../errors/errorHandler');
    var utils = require('../core/utils');
    var _ = require('lodash');
    var moment = require('moment');

    module.exports.teacher = {

        activities: function(req, res) {
            teacherActivityStats(req.params.id, req.body.fromDate, req.body.toDate)
                .then(function (result) {
                    res.status(200).json(result);
                })
                .catch(function (err) {
                    console.log(err);
                    errorHandler.handleError(err, req, res);
                })
        },

        activityCount: function(req, res) {
            teacherActivityCount(req.params.id, req.body.fromDate, req.body.toDate)
                .then(function (result) {
                    res.status(200).json(result);
                })
                .catch(function (err) {
                    console.log(err);
                    errorHandler.handleError(err, req, res);
                })
        },

        recipients: function (req, res) {
            teacherRecepientStats(req.params.id, req.body.fromDate, req.body.toDate)
                .then(function (result) {
                    res.status(200).json(result);
                })
                .catch(function (err) {
                    console.log(err);
                    errorHandler.handleError(err, req, res);
                })
        }
    };

    module.exports.student = {

        stats: function(req, res) {
            studentStats(req.params.id)
                .then(function (result) {
                    res.status(200).json(result);
                })
                .catch(function (err) {
                    console.log(err);
                    errorHandler.handleError(err, req, res);
                })
        },

        activityCount: function(req, res) {
            studentActivityCount(req.params.id, req.body.fromDate, req.body.toDate)
                .then(function (result) {
                    res.status(200).json(result);
                })
                .catch(function (err) {
                    console.log(err);
                    errorHandler.handleError(err, req, res);
                })
        },

        attendance: function (req, res) {
            studentAttendance(req.params.id, req.body.year, req.body.month)
                .then(function (result) {
                    res.status(200).json(result);
                })
                .catch(function (err) {
                    console.log(err);
                    errorHandler.handleError(err, req, res);
                })
        }
    };

    module.exports.ranking = {
        userRanking: function(req, res) {
            userRanking(req.params.customerId, req.params.studentId)
                .then(function(result){
                    res.status(200 ).json(result);
                })
        },

        houseRanking: function(req, res) {
            res.status(200 ).send('OK');
        },

        customerRanking: function(req, res) {
            customerRanking(req.params.customerId)
                .then(function(result){
                    res.status(200 ).json(result);
                })
        },
    };

    // TEACHER STATS
    // =====================
    /**
     * Returns activity Statistics For A Teacher
     * @param teacher
     */
    function teacherActivityCount(teacherId, fromDate, toDate) {

        if (typeof fromDate == 'undefined') fromDate = null;
        if (typeof toDate == 'undefined') toDate = null;

        var matchAndFitlers = [];
        matchAndFitlers.push({giver: new mongoose.Types.ObjectId(teacherId)});
        matchAndFitlers.push({activity: {$ne: null}});

        if (fromDate != null && toDate != null) {
            matchAndFitlers.push({timestamp: {$gte: fromDate}});
            matchAndFitlers.push({timestamp: {$lte: toDate}});
        }

        var query = [
            {$match: {$and: matchAndFitlers} },
            {
                $group: {
                    _id: "$activity",
                    activity: {$first: "$activity"},
                    total: {$sum: 1}
                }
            }
        ];

        return new Promise(function (resolve, reject) {
            Events.aggregate(query, function (err, result) {
                if (err) reject(err);

                Events.populate(result, {path: 'activity'})
                    .then(function (popEvents) {

                        resolve(popEvents);
                    })
                    .catch(function (popError) {
                        reject(popError);
                    })
            });

        });
    };

    /**
     * Teacher activity stats. All stats in 1 request.
     * @param teacherId
     * @param fromDate
     * @param toDate
     * @returns {Promise}
     */
    function teacherActivityStats(teacherId, fromDate, toDate) {

        if (typeof fromDate == 'undefined') fromDate = moment().startOf('year');
        if (typeof toDate == 'undefined') toDate = moment().endOf('year');

        var byMonth = Array(12);
        for (var i = 0; i<=11; i++) {
            byMonth[i] = new Object({
                month: moment.months()[i],
                rewards: 0,
                penalties: 0,
                activities: [],
                skills: {},
                houseXP: {}
            })
        }

        return Events.find({giver: teacherId})
            .and([{timestamp: {$gte: fromDate}}, {timestamp: {$lte: toDate}}, {activity: {$ne:null}}])
            .populate('house')
            .deepPopulate('activity.skills')
            .then(function (events) {

                events.forEach(function(e){

                    var month = moment(e.timestamp).month();
                    byMonth[month].activities.push(e.activity);

                    if (e.activity.reward.xp >= 0) byMonth[month].rewards += 1;
                    if (e.activity.reward.xp < 0) byMonth[month].penalties += 1;

                    //Skill
                    //Summary of skills affected by the activities this teacher has awarded as completed
                    e.activity.skills.forEach(function(s){
                        if (typeof byMonth[month].skills[s._id] == 'undefined') {
                            byMonth[month].skills[s._id] = {
                                name: s.name,
                                count: 1
                            }
                        }
                        else byMonth[month].skills[s._id].count += 1;
                    });

                    //House
                    //Summary of the amount of XP granted to each house each month.
                    if (typeof byMonth[month].houseXP[e.house._id] == 'undefined') {
                        byMonth[month].houseXP[e.house._id] = {
                            name: e.house.name,
                            xp: e.houseAward
                        };
                    }
                    else byMonth[month].houseXP[e.house._id].xp += e.houseAward;

                });

                return byMonth;
        })
    }

    /**
     * How many achievements has granted a teacher grouped by user.
     * @param teacher
     */
    function teacherRecepientStats(teacherId, fromDate, toDate) {

        if (typeof fromDate == 'undefined') fromDate = null;
        if (typeof toDate == 'undefined') toDate = null;

        var matchAndFitlers = [];
        matchAndFitlers.push({giver: new mongoose.Types.ObjectId(teacherId)});

        if (fromDate != null && toDate != null) {
            matchAndFitlers.push({timestamp: {$gte: fromDate}});
            matchAndFitlers.push({timestamp: {$lte: toDate}});
        }

        var query = [
            {$match: {$and: matchAndFitlers} },
            {
                $group: {
                    _id: "$user",
                    user: {$first: "$user"},
                    total: {$sum: 1}
                }
            }
        ];

        return new Promise(function (resolve, reject) {
            Events.aggregate(query, function (err, result) {
                if (err) reject(err);
                Events.populate(result, {path: 'user'})
                    .then(function (popEvents) {
                        resolve(popEvents);
                    })
                    .catch(function (popError) {
                        reject(popError);
                    })
            });

        });
    }


    // STUDENT STATS
    // ======================
    /**
     * Returns activity Statistics For A Teacher
     * @param teacher
     */
    function studentActivityCount(studentId, fromDate, toDate) {

        if (typeof fromDate == 'undefined') fromDate = null;
        if (typeof toDate == 'undefined') toDate = null;

        var matchAndFitlers = [];
        matchAndFitlers.push({user: new mongoose.Types.ObjectId(studentId)});
        matchAndFitlers.push({activity: {$ne: null}});

        if (fromDate != null && toDate != null) {
            matchAndFitlers.push({timestamp: {$gte: fromDate}});
            matchAndFitlers.push({timestamp: {$lte: toDate}});
        }

        var query = [
            {$match: {$and: matchAndFitlers} },
            {
                $group: {
                    _id: "$activity",
                    activity: {$first: "$activity"},
                    total: {$sum: 1}
                }
            }
        ];

        return new Promise(function (resolve, reject) {
            Events.aggregate(query, function (err, result) {
                if (err) reject(err);

                Events.populate(result, {path: 'activity'})
                    .then(function (popEvents) {

                        resolve(popEvents);
                    })
                    .catch(function (popError) {
                        reject(popError);
                    })
            });

        });
    };

    /**
     * Returns activity Statistics For A Student
     * @param teacher
     */
    function studentStats(studentId) {

        var fromDate = moment().startOf('year');

        var byMonth = Array(12);
        for (var i = 0; i<=11; i++) {
            byMonth[i] = new Object({
                month: moment().forLocale('es', moment.monthsShort ) [i],
                rewards: 0,
                penalties: 0,
                activities: [],
                skills: {},
                moneyGained: 0,
                moneySpent: 0,
                houseContribution: 0,
                questCompleted: 0,
                itemsPurchased:0
            })
        }
        return Events.find({user: studentId})
            .and([{timestamp: {$gte: fromDate}}])
            .populate('house')
            .deepPopulate('activity.skills')
            .then(function (events) {

                events.forEach(function(e){

                    var month = moment(e.timestamp).month();

                    //Activities
                    if (!_.isNil(e.activity)) {
                        
                        if (e.activity.reward.xp >= 0) byMonth[month].rewards += 1;
                        if (e.activity.reward.xp < 0) byMonth[month].penalties += 1;
                        byMonth[month].activities.push(e.activity);

                        //Skills
                        //Summary of skills affected by the activities this teacher has awarded as completed
                        e.activity.skills.forEach(function(s){
                            if (typeof byMonth[month].skills[s._id] == 'undefined') {
                                byMonth[month].skills[s._id] = {
                                    name: s.name,
                                    count: 1
                                }
                            }
                            else byMonth[month].skills[s._id].count += 1;
                        });
                    }

                    //Quests
                    if (!_.isNil( e.quest )) byMonth[month].questCompleted += 1;

                    //Items
                    if (!_.isNil( e.item )) byMonth[month].itemsPurchased += 1;

                    //HouseContribution
                    if (!_.isNil( e.houseAward )) byMonth[month].houseContribution += e.houseAward;

                    //goldGained
                    if (!_.isNil( e.moneyGained )) byMonth[month].moneyGained += e.moneyGained;

                    //moneySpent
                    if (!_.isNil( e.moneySpent )) byMonth[month].moneySpent += e.moneySpent;

                });

                return byMonth;
            })

    };

    function studentAttendanceMonthly (studentId, targetYear, targetMonth) {

        var fromDate = moment().year(targetYear).month(targetMonth-1).startOf('month');
        var toDate = moment().year(targetYear).month(targetMonth-1).endOf('month');

        var monthStats = new Object({
            present: 0,
            absent: 0,
            late: 0,
            canceled:0,
            monthName: moment.monthsShort()[targetMonth-1]
        });


        var andFilters = [];
        andFilters.push({date: {$gte: fromDate}});
        andFilters.push({date: {$lte: toDate}});
        andFilters.push({students: {$elemMatch: {student: studentId}}});

        return Attendance.find()
            .and(andFilters)
            .then(function(attendances){
                attendances.forEach(function(att){

                    var idx = _.findIndex(att.students, function(st) {
                        return st.student.toString() == studentId.toString()
                    });

                    var status = att.students[idx].status;
                    monthStats[status] += 1;
                });

                return monthStats;
            });
    }

    function studentAttendanceYearly(studentId, targetYear) {

        var fromDate;

        if (!_.isNil(targetYear)) fromDate = moment().year(targetYear).startOf('year');
        else fromDate = moment().startOf('year');

        var _monthly = Array(12);
        for (var i = 0; i<=11; i++) {
            _monthly[i] = new Object({
                present: 0,
                absent: 0,
                late: 0,
                canceled:0,
                monthName: moment().forLocale('es', moment.monthsShort ) [i]
            })
        }

        var andFilters = [];
        andFilters.push({date: {$gte: fromDate}});
        andFilters.push({students: {$elemMatch: {student: studentId}}});

        return Attendance.find()
            .and(andFilters)
            .then(function(attendances){
                attendances.forEach(function(att){
                    var month = moment(att.date).month();

                    var idx = _.findIndex(att.students, function(st) {
                        return st.student.toString() == studentId.toString()
                    });

                    var status = att.students[idx].status;

                    _monthly[month][status] += 1;
                });

                return _monthly;
            });
    }

    function studentAttendance(studentId, targetYear, targetMonth) {

        if (!_.isNil(targetMonth))return studentAttendanceMonthly(studentId, targetYear, targetMonth);
        else return studentAttendanceYearly(studentId, targetYear);
    }


    //RANKINGS
    //=======================
    function userRanking (customerId, studentId) {

        var andFilters = [];
        var resStudents = [];

        andFilters.push({'customer': mongoose.Types.ObjectId(customerId)});

        return Role.findOne( {name:"student"} )
            .then(function(role){
                andFilters.push({roles:role});

                return User.find()
                    .and(andFilters)
                    .populate("student.house")
                    .sort({"student.character.xp": -1})
                    .select("-credentials")
                    .lean(true)
            })
            .then(function(students){

                //Set the rank now, because later the array will be sliced and all relative positions are lost.
                students.forEach(function(s, idx, arr){
                    s.rank = idx + 1;
                });

                resStudents = students.slice(0,3);
                var idx = _.findIndex(students, function(s) { return s._id.equals(studentId) });

                var startIdx = idx - 4;
                var endIdx = idx + 5;


                //Si el startIdx < 0  el usuario es uno de los primeros 6.
                //Comenzo el largo del array para el otro lado siempre sin pasarme de lenght
                if (startIdx < 0) {
                    endIdx += Math.abs(startIdx);

                    if (endIdx > students.length) endIdx = students.length + 1;
                    startIdx = 0;
                }

                //Si el endIdx > length el usuario es uno de los ultimos 6
                //Compenzo el largo del array hacia el inicio siempre sin pasarme de cero hacia los negativos
                if (endIdx >= students.length) {
                    startIdx -= (endIdx - students.length);

                    if (startIdx < 0) startIdx = 0;
                    endIdx = students.length + 1;
                }

                //Si el comienzo es < 4 lo dejo en cuatro (esto es porque los primeros 3 lugares siempre van y ya los agregue al principio)
                if (startIdx < 3) startIdx = 3;


                if (startIdx < endIdx) resStudents = resStudents.concat(students.slice(startIdx,endIdx));

                return resStudents;
            })



    }



    function customerRanking (customerId) {

        var andFilters = [];
        var resStudents = [];

        andFilters.push({'customer': mongoose.Types.ObjectId(customerId)});

        return Role.findOne( {name:"student"} )
            .then(function(role){
                andFilters.push({roles:role});

                return User.find()
                    .and(andFilters)
                    .populate("student.house")
                    .sort({"student.character.xp": -1})
                    .select("-credentials")
                    .lean(true)
                    .limit(20)
            })
            .then(function(students){
                return students;
            })
    }

}).call(this);
