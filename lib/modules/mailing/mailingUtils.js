(function(){

    var mailingModel = require('./statusMailModel');
    var smProcModel = require('./statusMailProcessModel');
    var config = require('../../config');
    var mailer = require('./mailingController');
    var branchModel = require('../branches/branchModel');
    var customerModel = require('../customers/customerModel');
    var roleModel = require('../roles/roleModel');
    var userModel = require('../users/userModel');
    var groupModel = require('../groups/groupModel');
    var _  = require("lodash");

    module.exports.newMailRecord = newMailRecord;
    module.exports.triggerNewMailProcess = triggerNewMailProcess;
    module.exports.newProcessRecord = newProcessRecord;
    module.exports.sendEmailToParents = sendEmailToParents;

    /**
     * Creates a new mail record for a process.
     * @param recipientInfo {} - recepient information
     * @param messData {} - Mailgun received information (to update webhooks)
     * @param _procId  String - Associated process
     * @returns {*}
     */
    function newMailRecord(recipientInfo, messData, _procId) {

        var newRecord = new mailingModel();
        newRecord.messageId = messData.id;
        newRecord.to = recipientInfo.to;
        newRecord.student = recipientInfo.id;
        newRecord.customer = recipientInfo.customer;
        newRecord.branch = recipientInfo.branch;
        newRecord.process = _procId;
        return newRecord.save();

    };

    /**
     * Creates a new ProcessRecord.
     * @param _customer String (_id)
     * @param _branch String (_id)
     * @param [_detail] String (_id) - If null defaults to "Weekly Newsletter"
     * @returns {*}
     */
    function newProcessRecord(_customer, _branch, _teacher, _group, _detail) {

        var _proc = new smProcModel();
        _proc.customer = _customer;
        _proc.branch = _branch;
        _proc.teacher = _teacher;
        _proc.group = _group;

        if (!_.isNil(_detail)) _proc.detail = _detail;

        return _proc.save();
    }


    /**
     * Recevies a student and a HTML and sends an email to each of his/her parents containing the received HTML.
     * @param _st
     * @param _final_html
     * @param _procId
     */
    function sendEmailToParents(_st, _final_html, _procId, _subject){

        if (typeof _procId == "undefined") _procId = null;

        var promises = [];

        _st.student.parents.forEach(function(parent){

            var data = {
                from: config.mailer.from_field,
                to: parent.email,
                subject: '[Class Buzz] - ' + _subject,
                html: _final_html
            };

            promises.push(
                mailer.sendMail(data)
                    .then(function(mData){

                        var recepientInfo = {
                            id: _st._id,
                            to: parent.email,
                            customer: _st.customer._id,
                            branch: _st.branch._id
                        };

                        return newMailRecord(recepientInfo, mData, _procId);
                    })
            )

        });

        return Promise.all(promises);
    }

    /**
     * Gets users that have 'student' role for a customer & branch
     * @param _customer
     * @param _branch
     */
    function getStudents(_customer, _branch) {

        return new Promise(function (resolve, reject) {
            roleModel.findOne({name: 'student'})
                .then(function (role) {
                    return userModel.find({
                        $and: [
                            {roles: role._id},
                            {customer: _customer},
                            {branch: _branch}
                        ]
                    })
                        .populate('customer branches student.character.activities.activity')
                })
                .then(function (students) {
                    resolve(students);
                })
                .catch(function (err) {
                    reject(err);
                });
        })
    }


    /**
     * Triggers a new status mail process for passed branch & customer. Branch is optional.
     * If no branch is passed (null) then the process is triggered for all customer branches.
     * Customer is optional. If no customer is passed (null) then the process is triggered for all customers.
     * @param [_customer] String
     * @param [_branch] String
     * @param [procDetail] String - A description for the process. If no detail is passed it is assumed to "Weekly Newsletter"
     * @param iterator Function - A function with (student, processId) signature to be called for every student. It should return a promise, that returns an object
     * containing a a full rendered and inlined HTML for the body and an email subject.
     * {
     *  finalHTML:String,
     *  subject:String
     *  }
     */

    function triggerNewMailProcess(_customer, _branch, _teacher, _group, procDetail, iterator){

        if (typeof  iterator != "function") {
            throw new Error("Iterator is not a function");
            return;
        }


        if (_.isNil(_customer))   return triggerProcessForEveryone(procDetail, iterator);
        if (_.isNil(_branch))     return triggerProcessForCustomer(_customer, procDetail, iterator);
        if (_.isNil(_teacher))    return triggerProcessForACustomerBranch(_customer, _branch, procDetail, iterator);
        if (_.isNil(_group))      return triggerProcessForACustomerBranchTeacher(_customer, _branch, _teacher, procDetail, iterator);

        return triggerProcessForACustomerBranchTeacherGroup(_customer, _branch, _teacher, _group, procDetail, iterator);
    }

    function triggerProcessForACustomerBranchTeacher(_customer, _branch, _teacher, procDetail, iterator) {
        var promises = [];

        return new Promise(function(resolve, reject) {
            groupModel.find({teacher: _teacher})
                .populate("students")
                .then(function (teacherGroups) {

                    teacherGroups.forEach(function (g) {
                        promises.push(triggerProcessForACustomerBranchTeacherGroup(_customer, _branch, _teacher, g, procDetail, iterator));
                    });

                    return Promise.all(promises);
                })
                .then(function(result){
                    resolve(result);
                })
                .catch(function(err){
                    reject(err);
                })
        })
    }

    function triggerProcessForACustomerBranchTeacherGroup(_customer, _branch, _teacher, _group, procDetail, iterator) {

        if (typeof  iterator != "function") {
            throw new Error("Iterator is not a function");
            return;
        }

        var _proc;
        var _promises = [];

        return new Promise(function(resolve, reject){
            newProcessRecord(_customer, _branch, _teacher, _group, procDetail)
                .then(function(proc){
                    _proc = proc;
                    _group.students.forEach(function(st){
                        _promises.push (
                            iterator(st, _proc._id)
                                .then(function(resObj){
                                    sendEmailToParents(st, resObj.finalHTML, _proc._id, resObj.subject);
                                })
                        )
                    });
                    return Promise.all(_promises);

                })

                .then(function(result){
                    resolve("Group "+_group+" finished OK");
                })
                .catch(function(err){
                    reject(err);
                })
        });
    }

    /**
     * Triggers a status mail process a customer branch
     * @param _customer
     * @param _branch
     */
    function triggerProcessForACustomerBranch (_customer, _branch, procDetail, iterator){

        if (typeof  iterator != "function") {
            throw new Error("Iterator is not a function");
            return;
        }

        var _proc;
        var _promises = [];

        return new Promise(function(resolve, reject){
            newProcessRecord(_customer, _branch, null, null, procDetail)
                .then(function(proc){
                    _proc = proc;
                    return getStudents(_customer, _branch);
                })
                .then(function(students){
                    students.forEach(function(st){
                        _promises.push (
                            iterator(st, _proc._id)
                                .then(function(resObj){
                                    sendEmailToParents(st, resObj.finalHTML, _proc._id, resObj.subject);
                                })
                        )
                    });
                    return Promise.all(_promises);
                })
                .then(function(result){
                    resolve(result);
                })
                .catch(function(err){
                    reject(err);
                })
        });
    }

    /**
     * Triggers a status mail process for all customer branches
     * @param _customer
     */
    function triggerProcessForCustomer (_customer, procDetail, iterator){

        if (typeof  iterator != "function") {
            throw new Error("Iterator is not a function");
            return;
        }

        var promises = [];

        return new Promise(function(resolve, reject){

            branchModel.find({customer:_customer})
                .then(function(_branches){

                    _branches.forEach(function(_br){
                        promises.push(triggerProcessForACustomerBranch(_customer, _br._id, procDetail, iterator));
                    });

                    return Promise.all(promises);
                })
                .then(function(result){
                    resolve(result);
                })
                .catch(function(err){
                    reject(err);
                })
        });

    }

    /**
     * Triggers a status mail process for all customer branches
     */
    function triggerProcessForEveryone (procDetail, iterator){

        if (typeof  iterator != "function") {
            throw new Error("Iterator is not a function");
            return;
        }

        var promises = [];

        return new Promise(function(resolve, reject){
            customerModel.find()
                .then(function(_customers){

                    _customers.forEach(function(_cr){
                        promises.push(triggerProcessForCustomer(_cr._id, procDetail, iterator));
                    });

                    return Promise.all(promises);
                })
                .then(function(result){
                    resolve(result);
                })
                .catch(function(err){
                    reject(err);
                })
        });
    }

}).call(this);
