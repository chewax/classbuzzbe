(function () {
    'use strict';

    var userController = require('../../users/userController');
    var User = require('../../users/userModel');
    var Role = require('../../roles/roleModel');
    var Branch = require('../../branches/branchModel');
    var mailingUtils = require('../../mailing/mailingUtils');
    var statusMailsController = require('../../mailing/statusMailController');
    var errorHandler = require('../../errors/errorHandler');
    var mailgun = require('../../mailing/mailingController').mailgun;
    var MailBatch = require('../../mailing/mailBatch');


    var fromDate = process.argv[2];
    var toDate = process.argv[3];
    var customerId = process.argv[4] || null;

    var _studentRole = {};
    var dt = 0;

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
                    dt += 2000;
                    setTimeout(function() {
                        statusMailsController.createStudentStatusMail(st, _proc._id, true, new Date(fromDate), new Date(toDate) );
                    }, dt);
                })
            })
        })
    })
    .catch( function(err){ errorHandler.handleError(err); })

    // var _batch = new MailBatch("info@classbuzz.edu.uy", "Test", "/lib/templates/inlined/parentNewsletter.html");
    // _batch.setParamenter("_id");

    // Role.findOne({name:'student'})
    // .then(function(role){
    //     _studentRole = role;
    //     if (customerId != null) return Branch.find({customer: customerId});
    //     else return Branch.find();
        
    //     Branch.find();
    // })
    // .then(function(branches){
    //     branches.forEach(function(b){
    //         var _proc;
    //         mailingUtils.newProcessRecord(b.customer, b._id, null, null, null)
    //         .then(function(proc){
    //             _proc = proc;
    //             // return User.find({$and:[{roles:_studentRole._id}, {customer: b.customer}]}).populate('customer branch student.character.activities.activity student.character.skills.skill');
    //             return User.find({customer:"5706b65bdf0560b027cd0a0f"}).populate('customer branch student.character.activities.activity student.character.skills.skill');
    //         })
    //         .then(function(students){
    //             students.forEach(function(st){

    //                 var promises = [];

    //                 promises.push(
    //                     statusMailsController.createStudentStatusMailBatch(st, _proc._id, new Date(fromDate), new Date(toDate))
    //                     .then(function(vars){
    //                         console.log(vars);

    //                         st.student.parents.forEach(function(parent){

    //                             if (!parent || !parent.doc || !parent.email) return; 

    //                             var recepientInfo = {
    //                                 id: st._id,
    //                                 to: parent.email,
    //                                 customer: st.customer._id,
    //                                 branch: st.branch._id
    //                             };

    //                             newMailRecord(recepientInfo, {id:""}, _proc._id)
    //                             .then(function(record){
    //                                 vars["_id"] = record._id;
    //                                 _batch.addRecepient(recepientInfo.to, vars);
    //                             })

    //                         })
    //                     }))

    //                 return Promise.all(promises);
    //             })
    //         })
    //         .then(function(result){
    //             return _batch.prepare();
    //         })
    //         .then(function(result){
    //             console.log("Sending");
    //             console.log(_batch.data.to);
    //             _batch.send();
    //         })
    //     })
    // })
    // .catch( function(err){ errorHandler.handleError(err); })


    // var data = {
    //     from: 'From <name@comething.com>',
    //     to: ['kelian.puppi@gmail.com', 'dwaksman@gmail.com'],
    //     subject: 'Subject',
    //     html:  'Hello %recipient.first%'
    // };

    //     data["recipient-variables"] = {
    //         "kelian.puppi@gmail.com": {first: "Kelian", cupon:"1"},
    //         "dwaksman@gmail.com": {first: "Daniel", cupon:"2"}
    //     }

    //     // data["v:cupon-id"] = JSON.stringify("{cupon:\"%recipient.cupon%\"}");
    //     data["v:message-id"] = "%recipient.cupon%";

    // mailgun.messages().send(data, function(err, body) {
    //     if (err) console.dir(err.message);
    //     console.dir(body);
    // });

}).call(this);
