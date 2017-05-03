(function () {
    'use strict';

    var userController = require('../../users/userController');
    var User = require('../../users/userModel');
    var Role = require('../../roles/roleModel');
    var Branch = require('../../branches/branchModel');
    var mailingUtils = require('../../mailing/mailingUtils');
    var statusMailsController = require('../../mailing/statusMailController');
    var errorHandler = require('../../errors/errorHandler');

    var fromDate = process.argv[2];
    var toDate = process.argv[3];
    var customerId = process.argv[4] || null;

    var _studentRole = {};

    Role.findOne({name:'student'})
    .then(function(role){
        _studentRole = role;
        if (customerId != null) return Branch.find({customer: customerId});
        else return Branch.find();
        
        Branch.find();
    })
    .then(function(branches){
        branches.forEach(function(b){
            var _proc;
            mailingUtils.newProcessRecord(b.customer, b._id, null, null, null)
            .then(function(proc){
                _proc = proc;
                return User.find({$and:[{roles:_studentRole._id}, {customer: b.customer}]}).populate('customer branch student.character.activities.activity student.character.skills.skill');
            })
            .then(function(students){
                students.forEach(function(st){
                    statusMailsController.createStudentStatusMail(st, _proc._id, true, new Date(fromDate), new Date(toDate) );
                })
            })
        })
    })
    .catch( function(err){ errorHandler.handleError(err); })

}).call(this);
