(function(){

    var allow = require('../access/accessMiddleware');
    var statController = require('./statisticsController');

    module.exports.appendRoutes = function(router){

        //GET
        router.get('/statistics/teacher/all/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.teacher.api.allStats);
        router.get('/statistics/teacher/history/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.teacher.api.achievementsHistory);
        router.get('/statistics/teacher/yearly/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), statController.teacher.api.achievementsYearly);
        router.get('/statistics/student/yearly/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "parent", "student"]), statController.student.api.achievementsYearly);
        router.get('/statistics/student/stats/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "parent", "student"]), statController.student.api.achievementStats);
        router.get('/statistics/student/attendance/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "parent", "student"]), statController.student.api.attendanceStats);

        return router;
    }

}).call(this);

