(function () {
    'use strict';

    var config = require('../../config');
    var messages = require('../core/systemMessages');
    var customerModel = require('./customerModel');
    var userModel = require('../users/userModel');
    var roleModel = require('../roles/roleModel');
    var branchModel = require('../branches/branchModel');
    var houseModel = require('../houses/houseModel');
    var utils = require('../core/utils');
    var logger = require('../log/logger').getLogger();
    var errorHandler = require('../errors/errorHandler');

    module.exports.getNextHouse = function(req, res){
        getNextSortedHouse(req.params.id)
            .then(function(house){ res.status(200).json(house); })
            .catch(function(err){ errorHandler.handleError(err, req, res) })
    }


    function getNextSortedHouse(customerId){
        return new Promise( function(resolve, reject){
            var _lastSorted;
            var _customerHouses;

            houseModel.find({customer: customerId})
                .then (function(houses){
                    _customerHouses = houses;
                    return customerModel.findOne({_id:customerId})
                })
                .then (function(customer){
                    _lastSorted = customer.lastSorted;

                    if (!_lastSorted) {
                        customer.lastSorted = _customerHouses[0]._id;
                        return customer.save();
                    }

                    var houseIdArray = _customerHouses.map(function(h){
                        return h._id.toString();
                    });

                    var index = houseIdArray.indexOf(_lastSorted.toString());
                    var arrLength = houseIdArray.length;
                    index = (index + 1) % arrLength;

                    customer.lastSorted = houseIdArray[index];
                    return customer.save();
                })
                .then(function(customer){
                    customer.populate("lastSorted")

                    customerModel.populate(customer, {path:"lastSorted"}, function(err, house){
                        resolve(customer.lastSorted);
                    })


                })
                .catch(function(err){
                    logger.error("Error getting next sorting house", err);
                    reject(err);
                });
        });
    }


    module.exports.create = function (req, res) {
        var customer = new customerModel(req.body);
        customer.save()
            .then (function (result) { utils.handleSuccess(messages.success.onCreate("Customer"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function (req, res) {
        customerModel.findOneAndRemove({_id: req.body._id})
            .then (function (result) { utils.handleSuccess(messages.success.onDelete("Customer"), res) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.update = function (req, res) {

        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;

        customerModel.findOneAndUpdate({_id: element_id}, data)
            .then (function (result) {utils.handleSuccess(messages.success.onAction("Customer update"), res) })
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
                .select('houses')
                .deepPopulate('houses.head')
                .then( function (results){ res.status(200).json(results); } )
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
