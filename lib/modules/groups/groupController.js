(function () {
    'use strict';

    var config = require('../../config');
    var messages = require('../core/systemMessages');
    var groupModel = require('./groupModel');
    var utils = require('../core/utils');
    var errorHandler = require('../errors/errorHandler');
    var User = require('../users/userModel');
    var Role = require('../roles/roleModel');
    var mongoose = require('../../database').Mongoose;
    var _ = require('underscore');


    /**
     * Creates a new Group. Sends request response
     * @param req
     * @param res
     */
    module.exports.create = function (req, res) {
        var group = new groupModel(req.body);
        group.save()
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    /**
     * Removes group. Sends Request response
     * @param req
     * @param res
     */
    module.exports.remove = function (req, res) {
        groupModel.findOneAndRemove({_id: req.body._id}, {upsert:false})
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    /**
     * Updates a group. Sends Request Response
     * @param req
     * @param res
     */
    module.exports.update = function (req, res) {

        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;

        groupModel.findOneAndUpdate({_id: element_id}, data, {upsert:false})
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    /**
     * Add student to group.
     * @param req
     * @param res
     */
    module.exports.addStudentToGroup = function (req, res) {

        groupModel.findByIdAndUpdate( req.params.id.toString(),
            { $addToSet: {students: req.body.studentId }},
            { new: true }
        )
            .then(function(result){
                res.status(200).json(result)
            })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    /**
     * Remove student from group
     * @param req
     * @param res
     */
    module.exports.removeStudentFromGroup = function (req, res) {
        groupModel.findByIdAndUpdate( req.params.id,
            { $pull: { students: req.body.studentId }},
            { new: true }
        )
            .then(function(result){
                res.status(200).json(result)
            })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.find = {
        all: function (req, res) {
            groupModel.find()
                .populate('level')
                .select('-__v')
                .then(function (results) {
                    res.status(200).json(results);
                })
                .catch(function (err) {
                    errorHandler.handleError(err, req, res)
                });
        },

        one: function (req, res) {
            groupModel.findOne({_id: req.params.id})
                .populate('level')
                .select('-__v')
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        },

        /**
         * Get a group's students
         * @param req
         * @param res
         */
        students: function (req, res) {

            groupModel.findOne({_id:req.params.id})
                .populate('level')
                .deepPopulate('students.student.house')
                .then(function(group){
                    var _students = group.students;
                    res.status(200).json(_students);
                })
                .catch(function (err) { errorHandler.handleError(err, req, res) });
            
        },

        /**
         * Get a group's students complement: AKA the customer/branch students that still do not belong in this group.
         * @param req
         * @param res
         */
        studentsComplement: function (req, res) {

            groupModel.findOne({_id:req.params.id})
                .then(function(group){

                    var reTerm = req.body.searchField;
                    var terms = reTerm.split(" ");
                    if (terms.length > 1) {
                        reTerm = terms[0];
                        for (var i = 1; i < terms.length; i++ ) {
                            reTerm = reTerm + "|" + terms[i]  ;
                        }
                    }

                    var re = new RegExp(reTerm, "i"); // i = case insensitive
                    var limit = req.body.searchLimit || 10;

                    var orFilters = [{ firstName: { $regex: re }}, { lastName: { $regex: re }}]; // Compile OR filters
                    var andFilters = [{branch: group.branch}, {_id: {$nin: group.students}}];

                    Role.findOne({name:"student"})
                        .then( function(role) {
                            return User.find({roles:role._id})
                                .select("doc firstName lastName avatarURL student.character student.house branches groups")
                                .populate("student.house")
                                .or(orFilters)
                                .and(andFilters)
                                .limit(limit)
                        })
                        .then(function (results){ res.status(200).json(results) ;})
                        .catch(function (err) { errorHandler.handleError(err, req, res) });
                })
                .catch(function (err) { errorHandler.handleError(err, req, res) });

        },

        /**
         * Return a student's groups.
         * @param req
         * @param res
         */
        studentGroups: function (req, res) {

            groupModel.find({students:req.params.id})
                .populate('level')
                .deepPopulate('students.student.house')
                .then(function(groups){
                    res.status(200).json(groups);
                })
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        },

        /**
         * Return a teacher's groups.
         * @param req
         * @param res
         */
        teacherGroups: function (req, res) {
            if (req.query.condensed) {
                groupModel.find({teacher:req.params.id})
                    .then(function(groups){
                        res.status(200).json(groups);
                    })
                    .catch(function (err) { errorHandler.handleError(err, req, res) });
            }
            else {
                groupModel.find({teacher:req.params.id})
                    .populate('level')
                    .deepPopulate('students.student.house')
                    .then(function(groups){
                        res.status(200).json(groups);
                    })
                    .catch(function (err) { errorHandler.handleError(err, req, res) });
            }

        },

        byBranch: function (req, res) {
            groupModel.find()
                .where('branch').in(req.body.branches)
                .populate('level')
                .select('-__v')
                .then( function (results){ res.status(200).json(results); } )
                .catch(function (err) {errorHandler.handleError(err, req, res)});
        },

        /**
         * Search group as in searchField field and returns result as pagination as requested
         * {
         *  page: number,
         *  limit: number
         *  searchField: string
         *  seachFilters {
         *   branch: String,
         *   customer: String
         * }
         * @param req
         * @param res
         */
        paginate: function (req, res) {

            var reTerm = req.body.searchField;

            var terms = reTerm.split(" ");

            if (terms.length > 1) {
                reTerm = terms[0];
                for (var i = 1; i < terms.length; i++ ) {
                    reTerm = reTerm + "|" + terms[i]  ;
                }
            }

            //var re = new RegExp(req.body.searchField, "i"); // i = case insensitive
            var re = new RegExp(reTerm, "i"); // i = case insensitive
            var orFilters = [{ name: { $regex: re }}, { level: { $regex: re }}]; // Compile OR filters
            var andFilters = [];


            // Compile AND filters
            if (mongoose.Types.ObjectId.isValid(req.body.searchFilters.branch)) andFilters.push({'branch': req.body.searchFilters.branch});
            if (mongoose.Types.ObjectId.isValid(req.body.searchFilters.customer)) andFilters.push({'customer': req.body.searchFilters.customer});


            var pagOptions = {
                page: req.body.page || 1,
                limit: req.body.limit || 10,
                populate: 'students branch level',
                lean: true
            };

            if (andFilters.length > 0) {

                andFilters.push({$or:orFilters});

                groupModel.paginate({$and: andFilters }, pagOptions)
                    .then( function (results){ res.status(200).json(results); })
                    .catch(function (err) { errorHandler.handleError(err, req, res); });
            }

            else {

                groupModel.paginate({$or: orFilters }, pagOptions)
                    .then( function (results){ res.status(200).json(results); })
                    .catch(function (err) { errorHandler.handleError(err, req, res); });
            }
        }
    }

    /**
     * Given a student id, removes that student from every group it appears.
     * @param _sid
     */
    module.exports.removeStudentFromGroups = function(_sid) {

        return groupModel.findOneAndUpdate(
            { students: _sid},
            { $pull:    { students: _sid }}
        )
            .then(function(result){
                return result;
            })
            .catch(function (err) { errorHandler.handleError(err)});
    }

}).call(this);