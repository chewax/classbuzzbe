(function(){

    'use strict';
    var skillModel = require('./skillModel');
    var errorHandler = require('../errors/errorHandler');


    module.exports.create = function (req, res) {
        var skill = new skillModel(req.body);
        skill.save()
            .then( function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.remove = function (req, res) {
        skillModel.findByIdAndRemove(req.body._id)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.update = function (req, res) {
        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;
        skillModel.findByIdAndUpdate(element_id, data)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    };

    module.exports.find = function(req, res){
        if (typeof req.body.params.id != "undefined")
        {
            skillModel.findOne({_id:req.body.params.id})
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
        else
        {
            skillModel.find()
                .then (function (result) { res.status(200).json(result) })
                .catch(function (err) { errorHandler.handleError(err, req, res)});
        }
    }


    /**
     * Pre Bake Skills for a Customer.
     * Intended to be called upon creating a customer.
     *
     * @param customerId
     * @param [skills] If no skills are passed, then default skillset is applied
     */
    module.exports.bake = function( customerId, skills ) {

        if (typeof skills == "undefined" || skills == null || skills == [])
            skills = ["Use of English", "Grammar", "Writing", "Speaking", "Listening", "Behaviour"];
            //skills = ["Force Control", "Jedi Fighting", "Yoda Dialect", "Strategy & Battle Planification", "Light Sabre Skills", "Jedi Order History", "Behaviour"];

        skillModel.count({customer:customerId})
            .then(function(result){
                if (result == 0) skillModel.bake(skills, customerId);
            });
    }

    //TODO Remove this
    module.exports.bake("5706b65bdf0560b027cd0a0f");

}).call(this);

