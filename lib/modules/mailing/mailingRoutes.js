(function(){

    var allow = require('../access/accessMiddleware');
    var adhocMailController = require('./adhocMailController');
    var userController = require('../users/userController');

    module.exports.appendProtectedRoutes = function(router){

        router.post('/mail/adhoc', allow(["customer-admin", "branch-admin", "teacher"]), adhocMailController.api.newAdHocProcess);
        router.post('/mail/send-all', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.parentNewsletter);
        router.post('/mail/send-student', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.studentSpecificParentNewsletter);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }

}).call(this);
