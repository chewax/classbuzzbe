(function(){

    var allow = require('../access/accessMiddleware');
    var attController = require('./attendanceController');

    module.exports.appendProtectedRoutes = function(router){

        router.get ('/attendance', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), attController.find.all);
        router.put ('/attendance', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), attController.update);
        router.post ('/attendance', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), attController.create);
        router.delete ('/attendance', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), attController.remove);

        router.get('/attendance/group/:id', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), attController.find.byGroup);
        router.get('/attendance/group/:id/date/:date', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), attController.find.byGroupByDate);

        router.get('/attendance/:id', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), attController.find.all);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }

}).call(this);
