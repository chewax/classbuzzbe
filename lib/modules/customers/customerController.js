(function () {
    'use strict';

    var config = require('../../config');
    var customerModel = require('./customerModel');
    var userModel = require('../users/userModel');
    var roleModel = require('../roles/roleModel');
    var branchModel = require('../branches/branchModel');
    var houseModel = require('../houses/houseModel');
    var utils = require('../core/utils');
    var logger = require('../log/logger').getLogger();
    var errorHandler = require('../errors/errorHandler');
    var _ = require('lodash');

    module.exports.getNextHouse = function(req, res) {
        getNextSortedHouse(req.params.id)
            .then(function (house) {
                res.status(200).json(house);
            })
            .catch(function (err) {
                errorHandler.handleError(err, req, res)
            })
    };

    /**
     * Returns the emptiest house for a customer.
     * @param customerId
     * @returns {Promise}
     */
    function getNextSortedHouse(customerId){
        return new Promise( function(resolve, reject) {
            houseModel.find({customer: customerId})
                .then(function(houses){
                    var query = [];
                    var houseIds = houses.map(function(h){ return h._id });

                    query.push({$match: {'student.house': {$in: houseIds}}});
                    query.push({$group: {_id: '$student.house', count: { $sum: 1}}});
                    query.push({$sort: { count: 1 }});
                    

                    userModel.aggregate(query, function(err, result){

                        if (err) {
                            reject(err);
                            return;
                        }

                        //By default select the first house in the array. It its the house that has the lowest amount of
                        //students possible (only has the houses that have already been assigned at least to a student)
                        var selectedId = result[0]._id;

                        //Check if there is a house missing.
                        for (var i = 0; i < houseIds.length; i++) {
                            var idx = _.findIndex(result, function(h) {
                                return h._id.equals(houseIds[i]);
                            });

                            if (idx == -1) {
                                //Not found ==> Noone has it assigned yet ==> Lets assign it.
                                selectedId = houseIds[i];
                                break;
                            }
                        }

                        houseModel.findOne({_id: selectedId})
                            .then(function(house){
                                resolve(house)
                            })
                            .catch(function(err){
                                reject(err);
                            })

                    })

                })
                .catch(function(err){
                    reject(err);
                })
            });
    };


    module.exports.create = function (req, res) {
        var customer = new customerModel(req.body);
        customer.save()
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function (req, res) {
        customerModel.findOneAndRemove({_id: req.body._id})
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.update = function (req, res) {

        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;

        customerModel.findOneAndUpdate({_id: element_id}, data, {new: true})
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.getLogoURL = function (req, res) {
        customerModel.findOne({_id: req.params.id})
            .select('logoURL')
            .then(function (results){ res.status(200).json(results) ;})
            .catch(function (err) { errorHandler.handleError(err, req, res) });
    };

    module.exports.find = {
        all: function (req, res) {
            customerModel.find()
                .select('-__v')
                .populate('houses', '-head -__v')
                .then( function (results){ res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        },

        one: function (req, res) {
            customerModel.findOne({_id: req.params.id})
                .select('-__v')
                .populate('houses', '-head -__v')
                .then(function (results){ res.status(200).json(results) ;})
                .catch(function (err) { errorHandler.handleError(err, req, res) });
        }
    }


    module.exports.houses = {
        all: function (req, res) {
            customerModel.findOne({_id: req.params.id})
                .populate('houses')
                .then( function (results){ res.status(200).json(results.houses); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
    }

    module.exports.branches = {
        all: function (req, res) {
            branchModel.find({customer: req.params.id})
                .populate('headmaster', 'firstName lastName email phoneNumber')
                .then( function (results){ res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
    }

    module.exports.admins = {
        all: function (req, res) {
            roleModel.findOne({name: 'customer-admin'})
                .then( function (results) {
                    return userModel.find( {$and: [{customer: req.params.id}, {roles: results._id}]})
                        .select("firstName lastName email phoneNumber")
                })

                .then( function (results){ res.status(200).json(results); } )
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
    }




}).call(this);
