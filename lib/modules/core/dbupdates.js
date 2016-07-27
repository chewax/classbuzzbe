(function () {

'use strict';

    var traitModel = require('../traits/traitModel');
    var userModel = require('../users/userModel');
    var _ = require('underscore');

    module.exports.refactorTraitPrices = function(req, res) {
        refactorTraitPrices()
            .then(function(result){
                res.status(200).json(result);
            })
            .catch(function(err){
                console.log(err);
            })
    }
    module.exports.capitalizeNames = function(req, res){
        capitalizeNames()
            .then(function(result){
                res.status(200).json(result);
            })
            .catch(function(err){
                console.log(err);
            })
    }

    module.exports.addHatToHouseMembers = function(req, res){
        addHatToHouseMembers(req.body.houseId, req.body.traitId)
            .then(function(result){
                res.status(200).json(result);
            })
            .catch(function(err){
                console.log(err);
                res.status(500).json(err);
            })
    };

    function refactorTraitPrices(){
        var promises = [];
        return new Promise( function (resolve, reject) {
            traitModel.find()
                .then(function (traits) {

                    traits.forEach(function (t) {
                        t.price = t.price / 2;
                        promises.push(t.save());
                    });

                    return Promise.all(promises);
                })
                .then(function(res){
                    resolve(res);
                })
                .catch(function(err){
                    reject(err);
                })
        })
    }

    function capitalizeNames () {
        var promises = [];
        return new Promise( function (resolve, reject) {
            userModel.find()
                .select('firstName lastName')
                .then(function (users) {

                    users.forEach(function (u) {
                        promises.push(u.save());
                    });

                    return Promise.all(promises);
                })
                .then(function(res){
                    resolve(res);
                })
                .catch(function(err){
                    reject(err);
                })
        })
    }

    function addHatToHouseMembers(houseId, traitId) {
        var promises = [];
        return new Promise(function(resolve,reject){
            userModel.find({"student.house":houseId})
                .then(function(students){
                    students.forEach(function(s){
                        s.student.character.inventory.push(traitId);
                        s.student.character.traits.wearables.head = traitId;
                        promises.push(s.save());
                    })

                    return Promise.all(promises);
                })
                .then(function(res){
                    resolve(res);
                })
                .catch(function(err){
                    reject(err);
                })
        })

    }

}).call(this);