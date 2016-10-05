(function(){

    var allow = require('../access/accessMiddleware');
    var statController = require('./statisticsController');


    module.exports.appendProtectedRoutes = function(router){


        //TEACHER STATS
        router.post('/statistics/teacher/:id/activities', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.teacher.activities);
        router.post('/statistics/teacher/:id/activities/count', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.teacher.activityCount);
        router.post('/statistics/teacher/:id/activities/recipients', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.teacher.recipients);

        router.post('/statistics/student/:id/stats', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.student.stats);
        router.post('/statistics/student/:id/activities', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.student.activityCount);
        router.post('/statistics/student/:id/attendance', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.student.attendance);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }



}).call(this);

