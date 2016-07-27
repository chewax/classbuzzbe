(function () {
    'use strict';

    var config = require('../../config');
    var messages = require('../core/systemMessages');
    var groupModel = require('./groupModel');
    var utils = require('../core/utils');
    var errorHandler = require('../errors/errorHandler');
    var User = require('../users/userModel');
    var mongoose = require('../../database').Mongoose;
    var _ = require('underscore');

    module.exports.create = function (req, res) {
        var group = new groupModel(req.body);
        group.save()
            .then (function (result) { utils.handleSuccess(messages.success.onCreate("Group"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function (req, res) {
        User.find({groups:req.body._id})
            .then( function (result) {
                if (_.isEmpty(result)) {
                    deleteGroup();
                }
                else {
                    result.forEach(function (u) {
                        var index = u.groups.indexOf(req.body._id);
                        u.groups.splice(index, 1);
                        u.save();
                    });

                    deleteGroup();
                }
            });

        function deleteGroup(){
            groupModel.findOneAndRemove({_id: req.body._id}, {upsert:false})
                .then (function (result) { utils.handleSuccess(messages.success.onDelete("Group"), res) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }

    };

    module.exports.update = function (req, res) {

        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;

        groupModel.findOneAndUpdate({_id: element_id}, data, {upsert:false})
            .then (function (result) { utils.handleSuccess(messages.success.onAction("Group update"), res) })
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

        students: function (req, res) {

            groupModel.findOne({_id:req.params.id})
                .populate('level')
                .deepPopulate('students.student.house')
                .lean(true)
                .then(function(group){

                    var _students = group.students;
                    // Filter results to only students
                    _students.forEach( function (u) {
                        var levelInfo =  utils.getLevelInfo(u.student.character.xp);
                        u.student.character.levelInfo = levelInfo;
                    });

                    res.status(200).json(_students);
                })
                .catch(function (err) { errorHandler.handleError(err, req, res) });
            
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
        var promises = [];
        return groupModel.find({students:_sid})
            .then(function(groups){
                groups.forEach(function(g){
                    g.students = _.without(g.students, _sid);
                    promises.push(g.save());
                })

                return Promise.all(promises);
            })
    }

}).call(this);