(function(){

    var allow = require('../access/accessMiddleware');
    var mailController = require('./emailController');
    var userController = require('../users/userController');


    module.exports.appendProtectedRoutes = function(router){
        router.get('/mail/user/:id/inbox', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "parent"]), mailController.find.inbox);
        router.get('/mail/user/:id/outbox', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "parent"]), mailController.find.outbox);
        router.get('/mail/user/:id/archived', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "parent"]), mailController.find.archived);


        router.post('/mail', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), mailController.create);
        router.delete('/mail/:id', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), mailController.delete);
        router.post('/mail/send/group', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), mailController.sendToGroup);
        router.post('/mail/send/groups', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), mailController.sendToGroups);
        router.post('/mail/send/user', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), mailController.sendToUser);
        router.post('/mail/send/branch', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), mailController.sendToBranch);
        router.post('/mail/archive', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), mailController.archive);
        router.post('/mail/restore', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), mailController.restore);
        router.post('/mail/send-all', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.parentNewsletter);
        router.post('/mail/send-student', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.studentSpecificParentNewsletter);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }

}).call(this);
