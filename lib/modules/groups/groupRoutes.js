(function(){

    var allow = require('../access/accessMiddleware');
    var groupController = require('./groupController');
    var groupLevelController = require('./groupLevelController');

    module.exports.appendProtectedRoutes = function(router){

        //GET
        router.get('/groups', allow(['customer-admin']), groupController.find.all);
        router.get('/groups/customer/:id/levels', allow(['customer-admin','branch-admin','teacher']), groupLevelController.find.all);
        router.get('/groups/:id/students', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.find.students);
        router.get('/groups/students/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.find.studentGroups);
        router.get('/groups/teacher/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.find.teacherGroups);
        router.get('/groups/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.find.one);


        //POST
        router.post('/groups', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.create);
        router.post('/groups/:id/student', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.addStudentToGroup);

        router.delete('/groups', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.remove);
        router.delete('/groups/:id/student/:studentId', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.removeStudentFromGroup);

        router.put('/groups', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.update);

        router.post('/groups/find/branch', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.find.byBranch);
        router.post('/groups/find/paginate', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.find.paginate);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }



}).call(this);
