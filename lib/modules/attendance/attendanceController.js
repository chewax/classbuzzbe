(function () {
    'use strict';

    var attModel = require('./attendanceModel');
    var groupModel = require('../groups/groupModel');
    var _ = require('lodash');
    var errorHandler = require('../errors/errorHandler');
    var eh = require('../core/eventsHandler');


    var createNewAttendance = function(_attData, doSave){

        if (typeof doSave == "undefined") doSave = true;

        return groupModel.findOne({_id:_attData.group})
            .then(function(group){

                var newAtt = new attModel();
                newAtt.group = group._id;
                newAtt.date = new Date(_attData.date);
                newAtt.students = group.students.map(function(s){
                    return {student: s, status: 'present'}
                });

                if (doSave) return newAtt.save();
                else return newAtt;
            })
    }

    module.exports.create = function(req,res){
        var att = new attModel(req.body);
        att.save()
            .then( function (result) {
                eh.emit("newattendance", result);
                res.status(200).json(result);
            })
            .catch( function (err) { errorHandler.handleError(err, req, res) });
    };

    module.exports.update = function(req,res){
        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;

        attModel.findOneAndUpdate({_id:element_id}, data, {upsert:true})
            .then( function (result) { res.status(200).json(result) })
            .catch( function (err) { errorHandler.handleError(err, req, res) });

    };

    module.exports.remove = function(req,res){
        attModel.findOneAndRemove({_id:req.body._id})
            .then( function (result) { res.status(200).json(result) })
            .catch( function (err) { errorHandler.handleError(err, req, res) });
    };

    module.exports.find = {

        all: function(req,res){
            attModel.find()
                .populate('group')
                .populate('students._id', 'firstName lastName avatarURL student.character')
                .then( function (result) { res.status(200).json(result) })
                .catch( function (err) { errorHandler.handleError(err, req, res) });
        },

        one: function(req, res){
            attModel.find({_id: req.params.id})
                .populate('group')
                .populate('students._id', 'firstName lastName avatarURL student.character')
                .then( function (result) { res.status(200).json(result) })
                .catch( function (err) { errorHandler.handleError(err, req, res) });
        },

        byGroup: function (req, res){
            attModel.find({group: req.params.id})
                .populate('group')
                .populate('students.student', 'firstName lastName avatarURL student.character')
                .then( function (result) { res.status(200).json(result) })
                .catch( function (err) { errorHandler.handleError(err, req, res) });
        },

        byGroupByDate: function (req, res) {
            console.log(req.params);
            attModel.findOne({group: req.params.id})
                .and({date:req.params.date})
                .populate('group')
                .populate('students.student', 'firstName lastName avatarURL')
                .then( function (result) {

                    if(_.isNull(result)){

                        var _data = {
                            group: req.params.id,
                            date: req.params.date
                        }

                        return createNewAttendance(_data, false);
                    }

                    else {
                        res.status(200).json(result);
                        return;
                    }
                })
                .then(function(result){ return attModel.populate(result, { path:"students.student", select: "firstName lastName avatarURL" }) })
                .then(function(result){ res.status(200).json(result); })
                .catch( function (err) { errorHandler.handleError(err, req, res) });
        }



    }

}).call(this);