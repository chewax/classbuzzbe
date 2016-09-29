(function () {
    'use strict';

    var Events = require('../events/eventModel');
    var Attendance = require('../attendance/attendanceModel');
    var User = require('../users/userModel');
    var mongoose = require('../../database').Mongoose;
    var errorHandler = require('../errors/errorHandler');
    var utils = require('../core/utils');
    var _ = require('underscore');
    var moment = require('moment');

    module.exports.teacher = {
        teacheractivityStats: teacheractivityStats,
        teacherRecepientStats: teacherRecepientStats,
        activityYearly: teacheractivityYearly,
        api: {
            activitiesYearly: function (req, res) {
                teacheractivityYearly(req.params.id)
                    .then(function (result) {
                        res.status(200).json(result);
                    })
                    .catch(function (err) {
                        errorHandler.handleError(err, req, res)
                    });
            },
            allStats: function (req, res) {

                var resObj = {};

                var task1 = teacheractivityStats(req.params.id)
                    .then(function (result) {
                        resObj.groupedByactivity = result;
                    });

                var task2 = teacherRecepientStats(req.params.id)
                    .then(function (result) {
                        resObj.groupedByStudent = result;
                    });

                var task3 = teacheractivityHistory(req.params.id)
                    .then(function (result) {
                        resObj.activityHistory = result;
                    });

                var task4 = teacheractivityYearly(req.params.id)
                    .then(function (result) {
                        resObj.activityYearly = result;
                    });


                var tasks = [task1, task2, task3, task4];

                Promise.all(tasks)
                    .then(function (values) {
                        res.status(200).json(resObj);
                    })
                    .catch(function (err) {
                        errorHandler.handleError(err, req, res)
                    });

            }
        }
    },
    module.exports.student = {
        studentactivityStats: studentactivityStats,
        studentactivityYearly: studentactivityYearly,
        api: {
            activitiesYearly: function (req, res) {
                studentactivityYearly(req.params.id)
                    .then(function (result) {
                        res.status(200).json(result);
                    })
                    .catch(function (err) {
                        errorHandler.handleError(err, req, res)
                    });
            },
            activityStats: function (req, res) {
                studentactivityStats(req.params.id)
                    .then(function (result) {
                        res.status(200).json(result);
                    })
                    .catch(function (err) {
                        errorHandler.handleError(err, req, res)
                    });
            },
            attendanceStats: function (req, res) {
                studentAttendance(req.params.id)
                    .then(function (result) {
                        res.status(200).json(result);
                    })
                    .catch(function (err) {
                        errorHandler.handleError(err, req, res)
                    });
            },

        }
    }

    /**
     * Returns activity Statistics For A Teacher
     * @param teacher
     */
    function teacheractivityStats(teacherId, cb) {

        var query = [
            {$match: {giver: new mongoose.Types.ObjectId(teacherId)}},
            {
                $group: {
                    _id: "$activity",
                    activity: {$first: "$activity"},
                    total: {$sum: 1}
                }
            }
        ];

        // If it has callback, exec callback, else return promise
        if (typeof cb == 'function') {
            Events.aggregate(query, cb);
            return;
        }


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
     * Returns activity Statistics For A Teacher
     * @param teacher
     */
    function teacherRecepientStats(teacherId, cb) {

        var query = [
            {$match: {giver: new mongoose.Types.ObjectId(teacherId)}},
            {
                $group: {
                    _id: "$user",
                    user: {$first: "$user"},
                    total: {$sum: 1}
                }
            }
        ];

        // If it has callback, exec callback, else return promise
        if (typeof cb == 'function') {
            Events.aggregate(query, cb);
            return;
        }

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

    /**
     * Returns an object with 1 key representing the current year. That key contains 2 keys representing possitive
     * and negative rewards. Each of those has an array of numbers, where the position 0 represents the month 1 and so on.
     * The number contained is the amount of activities of that type granted on that month.
     * @param teacherId
     * @returns {Promise}
     */
    function teacheractivityYearly(teacherId) {
        var from = moment().startOf('year');

        return Events.find({giver: teacherId})
            .and({timestamp: {$gte: from}})
            .select('timestamp activity')
            .deepPopulate('activity.skill')
            .then(function (events) {

                var groupedByYear = _.groupBy(events, function (e) {
                    return e.timestamp.getFullYear();
                });

                // For each year, group by type
                for (var year in groupedByYear) {

                    groupedByYear[year] = _.groupBy(groupedByYear[year], function (e) {
                        return e.activity.skill.name;
                    });

                    // For each type, group by month counting the instances
                    for (var skill in groupedByYear[year]) {
                        groupedByYear[year][skill] = _.countBy(groupedByYear[year][skill], function (e) {
                            return e.timestamp.getMonth();
                        });

                        //Init aux var to hold the summary
                        var aux = [];
                        for (var i=0; i<=11; i++) aux[i] = 0;

                        //Reset aux var where corresponds
                        for (var month in groupedByYear[year][skill]){
                            aux[month] = groupedByYear[year][skill][month];
                        };

                        //reassign aux to the original document
                        groupedByYear[year][skill] = aux;
                    }
                }

                return groupedByYear;
            })
    }

    /**
     * Returns activity Statistics For A Student
     * @param teacher
     */
    function studentactivityStats(studentId, cb) {

        var now = new Date();
        var janfirst = new Date(now.getFullYear(),0,1);

        var query = [
            {$match: {
                $and: [
                    {user: new mongoose.Types.ObjectId(studentId)},
                    {activity: {$ne:null}},
                    {timestamp: {$gte: janfirst}}
                ]}
            },
            {
                $lookup: {
                    from: 'activities',
                    localField: 'activity',
                    foreignField: '_id',
                    as: 'activity'
                }
            },
            {
                $group: {
                    _id: "$activity._id",
                    activity: {$first: "$activity"},
                    total: {$sum: 1}
                }
            },
            {
                $sort: {'activity.type': -1}
            }
        ];

        // If it has callback, exec callback, else return promise
        if (typeof cb == 'function') {
            Events.aggregate(query, cb);
            return;
        }

        return new Promise(function (resolve, reject) {
            Events.aggregate(query, function (err, result) {

                if (err) reject(err);
                else {
                    //Eliminar las listas
                    result = result.map(function(r){
                        var newr = {};
                        newr._id = r._id[0];
                        newr.activity = r.activity[0];
                        newr.total = r.total;
                        return newr;
                    });

                    resolve(result);
                }
            });

        });
        
    };

    /**
     * Returns an object with 1 key representing the current year. That key contains 2 keys representing possitive
     * and negative rewards. Each of those has an array of numbers, where the position 0 represents the month 1 and so on.
     * The number contained is the amount of activities of that type awarded on that month.
     * @param studentId
     * @returns {Promise}
     */
    function studentactivityYearly(studentId) {
        var from = moment().startOf('year');

        return Events.find({user: studentId})
            .and({timestamp: {$gte: from}})
            .and({activity: { $ne: null } })
            
            .populate('activity', 'type')
            .then(function (events) {

                var groupedByYear = _.groupBy(events, function (e) {
                    return e.timestamp.getFullYear();
                });

                // For each year, group by type
                for (var year in groupedByYear) {

                    groupedByYear[year] = _.groupBy(groupedByYear[year], function (e) {
                        return e.activity.type;
                    });

                    // For each type, group by month counting the instances
                    for (var type in groupedByYear[year]) {
                        groupedByYear[year][type] = _.countBy(groupedByYear[year][type], function (e) {
                            return e.timestamp.getMonth();
                        });

                        //Init aux var to hold the summary
                        var aux = [];
                        for (var i=0; i<=11; i++) aux[i] = 0;

                        //Reset aux var where corresponds
                        for (var month in groupedByYear[year][type]){
                            aux[month] = groupedByYear[year][type][month];
                        };

                        //reassign aux to the original document
                        groupedByYear[year][type] = aux;
                    }
                }

                return groupedByYear;
            })
    }


    function studentAttendance(studentId) {

        var _st;
        var months = [0,1,2,3,4,5,6,7,8,9,10,11];
        var _monthly = months.map(function(m){
            return {
                present: 0,
                absent: 0,
                late: 0,
                month: m + 1,
                monthName: utils.getMonthName(m+1,'en')
            }
        });

        //TODO Watch out for groups refactor...groups not in user anymore
        return User.findOne({_id:studentId})
            .then(function(st){
                _st = st;
                var from = moment().startOf('year');
                return Attendance.find({group: {$in: st.groups}})
                    .and({date: {$gt: from}})
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
                    _monthly[att.month - 1][att.status] += 1;
                })

                return _monthly;

            })

    }

}).call(this);
