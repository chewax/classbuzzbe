(function(){

    var allow = require('../access/accessMiddleware');
    var statController = require('./statisticsController');


    module.exports.appendProtectedRoutes = function(router){

        //GET
        //router.get('/statistics/teacher/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.teacher.api.allStats);
        //TODO Add year param
        router.post('/statistics/teacher/:id/activities', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.teacher.activityCount);
        router.post('/statistics/teacher/:id/activities/year', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.teacher.activityYearly);
        //router.post('/statistics/teacher/:id/activities', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.teacher.api.activitiesYearly);
        //router.get('/statistics/student/:id/yearly', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "parent", "student"]), statController.student.api.activitiesYearly);
        //router.post('/statistics/student/:id/stats', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "parent", "student"]), statController.student.api.activityStats);
        //router.get('/statistics/student/:id/attendance', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "parent", "student"]), statController.student.api.attendanceStats);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }



}).call(this);

