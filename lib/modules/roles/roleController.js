(function () {
    'use strict';

    var roleModel = require ('./roleModel');
    var logger = require('../log/logger').getLogger();
    var messages = require('../core/systemMessages');
    var errorHandler = require('../errors/errorHandler');

    module.exports.createRole = function(req,res){

        logger.info("Creating role: " + json.stringify(req.body));

        var role = new roleModel;
        role.name = req.body.name;
        role.tier = req.body.tier;
        role.mayGrant = req.body.mayGrant;
        role.save(function(err, result) {
            if (err) {
                logger.error("Error trying to save a role: " + json.stringify(req.body));
                res.status(500).send(messages.error.onCreate('role'));
                return;
            }

            res.status(200).send(result);
        });
    };

    module.exports.initDB = function(req, res) {
        // ROLES
        // super-admin (full control)
        // customer-admin (customer)
        // branch-admin (branch)
        // sub-branch-admin (school) //branches have several "independent schools"
        // teacher
        // student
        // parent

        var parentRole = new roleModel;
        parentRole.name = "parent";
        parentRole.tier = 1,
        parentRole.mayGrant = []
        parentRole.save(function (err, result) {
              if (err) {
                logger.error("Error while initializing roles. Could not save parent role");
                res.status(500).send("Ther was an error saving a role. The support team is already been notified");
                return;
            }
        });

        var studentRole = new roleModel;
        studentRole.name = "student";
        studentRole.tier = 1,
        studentRole.mayGrant = []
        studentRole.save(function (err, result) {
              if (err) {
                logger.error("Error while initializing roles. Could not save student role");
                res.status(500).send("Ther was an error saving a role. The support team is already been notified");
                return;
            }
        });

        var teacherRole = new roleModel;
        teacherRole.name = "teacher";
        teacherRole.tier = 1,
        teacherRole.mayGrant = []
        teacherRole.save(function (err, result) {
              if (err) {
                logger.error("Error while initializing roles. Could not save teacher role");
                res.status(500).send("Ther was an error saving a role. The support team is already been notified");
                return;
            }
        });

        var subBranchAdmin = new roleModel;
        subBranchAdmin.name = "sub-branch-admin";
        subBranchAdmin.tier = 2,
        subBranchAdmin.mayGrant = [teacherRole.id, studentRole.id, parentRole.id];
        subBranchAdmin.save(function (err, result) {
              if (err) {
                logger.error("Error while initializing roles. Could not save sub-branch-admin role");
                res.status(500).send("Ther was an error saving a role. The support team is already been notified");
                return;
            }
        });

        var branchAdmin = new roleModel;
        branchAdmin.name = "branch-admin";
        branchAdmin.tier = 3,
        branchAdmin.mayGrant = [subBranchAdmin.id, teacherRole.id, studentRole.id, parentRole.id];
        branchAdmin.save(function (err, result) {
              if (err) {
                logger.error("Error while initializing roles. Could not save branch-admin role");
                res.status(500).send("Ther was an error saving a role. The support team is already been notified");
                return;
            }
        });

        var customerAdmin = new roleModel;
        customerAdmin.name = "customer-admin";
        customerAdmin.tier = 4,
        customerAdmin.mayGrant = [branchAdmin.id, subBranchAdmin.id, teacherRole.id, studentRole.id, parentRole.id];
        customerAdmin.save(function (err, result) {
              if (err) {
                logger.error("Error while initializing roles. Could not save customer-admin role");
                res.status(500).send("Ther was an error saving a role. The support team is already been notified");
                return;
            }
        });

        var superAdmin = new roleModel;
        superAdmin.name = "super-admin";
        superAdmin.tier = 5,
        superAdmin.mayGrant = [customerAdmin.id ,branchAdmin.id, subBranchAdmin.id, teacherRole.id, studentRole.id, parentRole.id];
        superAdmin.save(function (err, result) {
              if (err) {
                logger.error("Error while initializing roles. Could not save super-admin role");
                res.status(500).send("Ther was an error saving a role. The support team is already been notified");
                return;
            }
        });

        superAdmin.mayGrant.push(superAdmin._id);

        superAdmin.save(function (err, result) {
            if (err) {
                logger.error("Error while initializing roles. Could not save super-admin role");
                res.status(500).send("Ther was an error saving a role. The support team is already been notified");
                return;
            }
        });

        res.status(200).send("Role collection has been initialized.");
    }

    module.exports.findByName = function(req, res) {
        roleModel.findOne({name: req.body.name})
            .populate("mayGrant")
            .then(function(result) {
                res.status(200).json(result);
            })
            .catch(function(err) {
                errorHandler.handleError(err, req, res);
            });
    }

    module.exports.findAll = function(req, res) {
        roleModel.find()
        .then( function (results){ res.status(200).json(results); } )
        .catch(function (err) { errorHandler.handleError(err, req, res)});
    }

    module.exports.query = function(req, res) {
        roleModel.find(reqda.body)
            .then( function (results){ res.status(200).json(results); } )
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    }

}).call(this);