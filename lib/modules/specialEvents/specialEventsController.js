(function(){

    'use strict';
    var specialEventsModel = require('./specialEventsModel');
    var userModel = require('../users/userModel');
    var errorHandler = require('../errors/errorHandler');
    var eh = require('../core/eventsHandler');
    var _ = require('lodash')


    module.exports.create = function (req, res) {
        var specialEvent = new specialEventsModel(req.body);
        specialEvent.save()
            .then( function (result) {
                res.status(200).json(result);
            })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function (req, res) {
        specialEventsModel.findByIdAndRemove(req.body._id)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.update = function (req, res) {
        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;
        specialEventsModel.findByIdAndUpdate(element_id, data)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.find = function(req, res){
        if (typeof req.body.params.id != "undefined")
        {
            specialEventsModel.findOne({_id:req.body.params.id})
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
        else
        {
            specialEventsModel.find()
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
    };

    module.exports.findByCustomer = function(req, res){
        specialEventsModel.find({customer:req.params.id})
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    }


    module.exports.lookForStudentNewSpecialEvents = function(userId) {
        var _user = {};

        userModel.findOne({_id:userId})
            .populate('groupsBelonging roles')
            .then(function(user){

                _user = user;

                //If user not student, then special events are not to be notified.
                if (!_user.hasRole('student')) return;

                // Student's Customer
                var _customer = _user.customer;

                // Student's Groups.
                var _groups =  _user.groupsBelonging.map(function(g){
                    return g._id;
                });

                // Student's Teachers
                var _teachers = _user.groupsBelonging.map(function(g){
                    return g.teacher;
                });
                _teachers = _.uniqBy(_teachers, '_id');

                // Already assigned events
                var _assignedEvents = _user.student.character.specialEvents.map(function(se){
                    return se.specialEvent;
                });

                var orFilters = [];
                var andFilters = [];

                // Special event applies to user?
                orFilters.push({group: {$in: _groups}});
                orFilters.push({teacher: {$in: _teachers}});
                orFilters.push({$or: [{customer: _customer}, {customer: null}] });

                // SpecialEvent is activeNow?
                andFilters.push({startingDate: {$lte: Date.now()}});
                andFilters.push({$or:[ {endingDate: {$gte: Date.now()}}, {endingDate: null}] });

                // Student has not been already assigned that special event?
                andFilters.push({_id: {$nin: _assignedEvents}});

                return specialEventsModel.find()
                    .and(andFilters)
                    .or(orFilters)
            })

            .then(function(newSpecialEvents){
                if (_.isNil(newSpecialEvents)) return;
                
                newSpecialEvents.forEach(function(se){
                    _user.addSpecialEvent(se);
                    eh.emit('incomingspecialevent', _user, se);
                });
            })
    }


}).call(this);
