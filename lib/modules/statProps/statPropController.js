(function(){

    'use strict';
    var userModel = require ('../users/userModel');
    var statPropModel = require ('./statPropModel');
    var userStatPropModel = require ('./userStatPropModel');
    var skillModel = require('../skills/skillModel');
    var achievementsController = require('../achievements/achievementController');
    var errorHandler = require('../errors/errorHandler');
    var _ = require('lodash');
    var eh = require('../core/eventsHandler');

    module.exports.create = function (req, res) {
        var statProp = new statPropModel(req.body);
        statProp.save()
            .then( function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function (req, res) {
        statPropModel.findByIdAndRemove(req.body._id)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.update = function (req, res) {
        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;
        statPropModel.findByIdAndUpdate(element_id, data)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    /**
     * Search user as in searchField field and returns result as pagination as requested
     * {
         *  page: number,
         *  limit: number
         *  searchField: string
         * }
     * @param req
     * @param res
     */
    module.exports.paginate = function(req, res) {

        var pagOptions = {
            page: req.body.page || 1,
            limit: req.body.limit || 10,
            lean: true
        };

        User.paginate({}, pagOptions)
            .then( function (results){
                res.status(200).json(results);
            })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.find = function(req, res){
        if (typeof req.body.params.id != "undefined")
        {
            statPropModel.findOne({_id:req.body.params.id})
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
        else
        {
            statPropModel.find()
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
    };


    eh.on('questcompleted', function(user, quest) {

        var promises = [];
        var statPropsForEvent = ['QuestsCompleted', 'HouseContribution', 'MoneyEarned'];

        // Total quests completed
        promises.push(IncrementStatProp(statPropsForEvent[0], user));

        // Total house contribution
        promises.push(IncrementStatProp(statPropsForEvent[1], user, quest.houseXp));

        // Total money earned
        promises.push(IncrementStatProp(statPropsForEvent[2], user, quest.reward.money));

        Promise.all(promises)
            .then(function(result) {
                // Check achievements
                achievementsController.checkForAchievements(user, statPropsForEvent);
            })
            .catch(function(err) { errorHandler.handleError(err); });
    });

    eh.on('goalcompleted', function(user, goal){

        var statPropsForEvent = ['GoalsCompleted'];

        // Total goals completed
        IncrementStatProp('GoalsCompleted', user)
            .then(function(result){
                // Check achievements
                achievementsController.checkForAchievements(user, statPropsForEvent);
            })
            .catch(function(err) { errorHandler.handleError(err); });
    });

    eh.on('activitycompleted', function(user, activity){

        // Penalties
        if(activity.reward.xp < 0) return;

        var promises = [];
        var statPropsForEvent = ['ActivitiesCompleted', 'HouseContribution', 'MoneyEarned'];

        skillModel.find({_id: {$in: activity.skills}})
            .then(function(skills){

                // Total activities per skills
                skills.forEach(function(skill){
                    var skillName = skill.name.removeInvalidChars() + statPropsForEvent[0];
                    promises.push(IncrementStatProp(skillName, user));
                    statPropsForEvent.push(skillName);
                });

                // Total activities
                promises.push(IncrementStatProp(statPropsForEvent[0], user));

                // Total house contribution
                promises.push(IncrementStatProp(statPropsForEvent[1], user, activity.houseXp));

                // Total money earned
                promises.push(IncrementStatProp(statPropsForEvent[2], user, activity.reward.money));

                return Promise.all(promises);
            })
            .then(function(result) {
                // Check achievements
                achievementsController.checkForAchievements(user, statPropsForEvent);
            })
            .catch(function(err) { errorHandler.handleError(err); });

    });

    eh.on('traitacquired', function(user, trait){

        var promises = [];
        var statPropsForEvent = ['ItemsPurchased', 'MoneySpent'];

        // Total items purchased
        promises.push(IncrementStatProp(statPropsForEvent[0], user));

        // Total money spent
        promises.push(IncrementStatProp(statPropsForEvent[1], user, trait.price));

        // Total pets purchased
        if(trait.traitType = 'wearable' && trait.placement == 'companionRight') {
            statPropsForEvent.push('PetsPurchased');
            promises.push(IncrementStatProp(statPropsForEvent[2], user));
        }

        Promise.all(promises)
            .then(function(result) {
                // Check achievements
                achievementsController.checkForAchievements(user, statPropsForEvent);
            })
            .catch(function(err) { errorHandler.handleError(err); });
    });
    
    // Max connection days streak
    eh.on('newstreakday', function(user){

        var promises = [];
        var statPropsForEvent = ['LongestAccessStreak'];
        var _and = [];
        _and.push({user: user._id});

        statPropModel.findOne({name: statPropsForEvent[0]})
            .then(function (statPropDB) {

                if (statPropDB == null) return;

                _and.push({statProp: statPropDB._id});

                userStatPropModel.findOne({$and: _and})
                    .then(function(maxUserStreakDays){
                        if (maxUserStreakDays == null)  {
                            // Initialize new streak day
                            promises.push(IncrementStatProp(statPropsForEvent[0], user));
                        } else {
                            // Check for new record
                            if(user.connectionStreakDays > maxUserStreakDays.value) {
                                promises.push(IncrementStatProp(statPropsForEvent[0], user, user.connectionStreakDays));
                            }
                        }
                        Promise.all(promises);
                    })
                    .then(function(result){
                        // Check achievements
                        achievementsController.checkForAchievements(user, statPropsForEvent);
                    })

            })
            .catch(function(err) { errorHandler.handleError(err); });
    });

    // Max attendance days streak
    eh.on('newattendance', function(attendance){

        var promises = [];
        var _and = [];

        var usersMap = attendance.students.map(function(std){
            return std.student;
        });

        _and.push({user: {$in: usersMap}});

        userStatPropModel.find({$and: _and})
            .populate('statProp')
            .then(function(statPropsResult){

                var statPropsPerUser = _.groupBy(statPropsResult, function(stp){
                    return stp.user;
                });

                var attendanceStatusPerUser = _.groupBy(attendance.students, function(std){
                    return std.student;
                });

                usersMap.forEach(function(usr){

                    var userStatus = attendanceStatusPerUser[usr][0].status;
                    var longestAttendanceStreak;
                    var currentAttendanceStreak;

                    // If statPropsPerUser is empty means that the user doesn't have the statPros needed in the db yet
                    // so we'll attempt to initialize in the else
                    if(!_.isEmpty(statPropsPerUser)) {

                        // Get the object containing the statProp 'LongestAttendanceStreak' for this user
                        longestAttendanceStreak = _.find(statPropsPerUser[usr],
                            function(stp) { return stp.name == 'LongestAttendanceStreak';
                        });

                        // Get the object containing the statProp 'CurrentAttendanceStreak' for this user
                        currentAttendanceStreak = _.find(statPropsPerUser[usr],
                            function(stp) { return stp.name == 'CurrentAttendanceStreak';
                        });

                        if(userStatus == 'present') {
                            // Increment current streak and check if he/she has a new record
                            promises.push(IncrementStatProp('CurrentAttendanceStreak', usr));

                            if(currentAttendanceStreak.value == longestAttendanceStreak.value) {
                                promises.push(IncrementStatProp('LongestAttendanceStreak', usr));
                            }
                        }

                        if(userStatus == 'absent' || userStatus == 'late') {
                            promises.push(IncrementStatProp('CurrentAttendanceStreak', usr, 0));
                        }

                    } else {
                        // If userStatus is not present means that the first streak hasn't been started so do nothing
                        if(userStatus == 'present') {
                            promises.push(IncrementStatProp('LongestAttendanceStreak', usr));
                            promises.push(IncrementStatProp('CurrentAttendanceStreak', usr));
                        }
                    }
                });
                return Promise.all(promises);
            })
            .then(function(result){
                // TODO: implement achievements per user
                // Check achievements
            })
            .catch(function(err) { errorHandler.handleError(err); });
    });

    function IncrementStatProp(statPropName, user, incValue){

        return new Promise(function(resolve, reject) {

            incValue = typeof incValue !== 'undefined' ? incValue : 1;

            var _statPropDB;

            var document = {name: statPropName};

            statPropModel.findOneOrCreate(document, document)
                .then(function (statPropDB) {

                    _statPropDB = statPropDB;

                    return userStatPropModel.update({
                            $and: [
                                {user: user._id},
                                {statProp: _statPropDB._id}
                            ]
                        },
                        {$inc: {value: incValue}},
                        {upsert: true}
                    )
                })
                .then(function(result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                })
        })
    }
}).call(this);
