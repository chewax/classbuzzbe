(function(){

    var allow = require('../access/accessMiddleware');
    var statController = require('./statisticsController');


    module.exports.appendProtectedRoutes = function(router){


        //TEACHER STATS
        router.post('/statistics/teacher/:id/activities', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.teacher.activities);
        router.post('/statistics/teacher/:id/activities/count', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.teacher.activityCount);
        router.post('/statistics/teacher/:id/activities/recipients', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.teacher.recipients);

        //STUDENT STATS
        router.post('/statistics/student/:id/stats', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.student.stats);
        router.post('/statistics/student/:id/activities', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.student.activityCount);
        router.post('/statistics/student/:id/attendance', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.student.attendance);

        //RANKINGS
        router.get('/statistics/customer/:customerId/ranking/students/:studentId', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.ranking.userRanking);
        router.get('/statistics/customer/:customerId/ranking/houses', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.ranking.houseRanking);
        router.get('/statistics/customer/:customerId/ranking', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.ranking.customerRanking);


        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }



}).call(this);

