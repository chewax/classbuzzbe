(function(){

    'use strict';
    var userModel = require ('../users/userModel');
    var statPropModel = require ('./statPropModel');
    var userStatPropModel = require ('./userStatPropModel');
    var skillModel = require('../skills/skillModel');
    var errorHandler = require('../errors/errorHandler');
    var _ = require('lodash');
    var eh = require('../core/eventsHandler');


    eh.on('questcompleted', function(user, quest) {

        var promises = [];

        // Total quests completed
        promises.push(IncrementStatProp('QuestsCompleted', user));

        // Total house contribution
        promises.push(IncrementStatProp('HouseContribution', user, quest.houseXp));

        // Total money earned
        promises.push(IncrementStatProp('MoneyEarned', user, quest.reward.money));

        Promise.all(promises)
            .then(function(result) {
                // Check achievements
            })
            .catch(function(err) { errorHandler.handleError(err); });
    });

    eh.on('goalcompleted', function(user, goal){

        // Total goals completed
        IncrementStatProp('GoalsCompleted', user)
            .then(function(result){
                // Check achievements
            })
            .catch(function(err) { errorHandler.handleError(err); });
    });

    eh.on('activitycompleted', function(user, activity){

        var promises = [];

        skillModel.find({_id: {$in: activity.skills}})
            .then(function(skills){

                // Total activities per skills
                skills.forEach(function(skill){
                    promises.push(IncrementStatProp(skill.name + 'ActivitiesCompleted', user));
                });

                // Total activities
                promises.push(IncrementStatProp('ActivitiesCompleted', user));

                // Total house contribution
                promises.push(IncrementStatProp('HouseContribution', user, activity.houseXp));

                // Total money earned
                promises.push(IncrementStatProp('MoneyEarned', user, activity.reward.money));

                return Promise.all(promises);
            })
            .then(function(result) {
                // Check achievements
            })
            .catch(function(err) { errorHandler.handleError(err); });

    });

    eh.on('traitacquired', function(user, trait){

        var promises = [];

        // Total items purchased
        promises.push(IncrementStatProp('ItemsPurchased', user));

        // Total money spent
        promises.push(IncrementStatProp('MoneySpent', user, trait.price));

        // Total pets purchased
        if(trait.traitType = 'wearable' && trait.placement == 'companionRight') {
            promises.push(IncrementStatProp('PetsPurchased', user));
        }

        Promise.all(promises)
            .then(function(result) {
                // Check achievements
            })
            .catch(function(err) { errorHandler.handleError(err); });
    });


    // Max connection days streak
    eh.on('newstreakday', function(user){

        var promises = [];
        var _and = [];
        _and.push({user: user._id});

        statPropModel.findOne({name: 'LongestAccessStreak'})
            .then(function (statPropDB) {

                if (statPropDB == null) return;

                _and.push({statProp: statPropDB._id});

                // Is this OK?
                userStatPropModel.findOne({$and: _and})
                    .then(function(maxUserStreakDays){
                        if (maxUserStreakDays == null)  {
                            // Initialize new streak day
                            promises.push(IncrementStatProp('LongestAccessStreak', user));
                        } else {
                            // Check for new record
                            if(user.connectionStreakDays > maxUserStreakDays.value) {
                                promises.push(IncrementStatProp('LongestAccessStreak', user, user.connectionStreakDays));
                            }
                        }
                        Promise.all(promises);
                    })
                    .then(function(result){
                        // Check achievements
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
                })
                return Promise.all(promises);
            })
            .then(function(result){
                // Check achievements
            })
            .catch(function(err) { errorHandler.handleError(err); });
    });


    function IncrementStatProp(statPropName, user, incValue){

        return new Promise(function(resolve, reject) {

            incValue = typeof incValue !== 'undefined' ? incValue : 1;

            var _statPropDB;

            statPropModel.findOne({name: statPropName})
                .then(function (statPropDB) {

                    if (statPropDB == null) return;

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



   /* userModel.findOne({firstName: 'Anakin'})
        .then(function(user) {
            eh.emit('activitycompleted', user, {skill:{name: 'Pronunciation'}});
        })
        .catch(function(err) { errorHandler.handleError(err); })*/

    // When listening a new event that triggers an achievement- trigger achievementunlocked




}).call(this);
