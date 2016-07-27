(function(){

    var allow = require('../access/accessMiddleware');
    var attController = require('./attendanceController');

    module.exports.appendRoutes = function(router){

        router.get('/attendance/all', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), attController.find.all);

        router.post('/attendance/create', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), attController.create);
        router.post('/attendance/remove', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), attController.remove);
        router.post('/attendance/update', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), attController.update);
        router.post('/attendance/find/byGroup', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), attController.find.byGroup);
        router.post('/attendance/find/byGroup/byDate', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), attController.find.byGroupByDate);

        return router;
    }

}).call(this);
