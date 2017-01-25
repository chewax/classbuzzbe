(function(){

    var allow = require('../access/accessMiddleware');
    var mailController = require('./emailController');
    var userController = require('../users/userController');

    module.exports.appendProtectedRoutes = function(router){

        // GET
        router.get('/mail/:userId/inbox', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "parent"]), mailController.find.inbox);
        router.get('/mail/:userId/outbox', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "parent"]), mailController.find.outbox);
        router.get('/mail/:userId/archived', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "parent"]), mailController.find.archived);
        // POST
        router.post('/mail/queue', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), mailController.create);
        router.post('/mail/send/group', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), mailController.sendToGroup);
        router.post('/mail/send/groups', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), mailController.sendToGroups);
        router.post('/mail/send/user', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), mailController.sendToUser);
        router.post('/mail/send/branch', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), mailController.sendToBranch);
        router.post('/mail/archive', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), mailController.archive);
        router.post('/mail/restore', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), mailController.restore);
        router.post('/mail/delete', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), mailController.delete);
        router.post('/mail/send-all', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.parentNewsletter);
        router.post('/mail/send-student', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.studentSpecificParentNewsletter);

        return router;
    };

    module.exports.appendPublicRoutes = function(router){

        return router;
    };

}).call(this);
