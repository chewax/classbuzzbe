(function(){

    var allow = require('../access/accessMiddleware');
    var groupController = require('./groupController');
    var groupLevelController = require('./groupLevelController');

    module.exports.appendProtectedRoutes = function(router){

        //GET
        router.get('/groups', allow(['customer-admin']), groupController.find.all);
        router.get('/groups/customer/:id/levels', allow(['customer-admin','branch-admin','teacher']), groupLevelController.find.all);
        router.get('/groups/:id/students', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.find.students);
        router.get('/groups/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.find.one);


        //POST
        router.post('/groups', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.create);
        router.delete('/groups', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.remove);
        router.put('/groups', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.update);
        router.post('/groups/find/branch', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.find.byBranch);
        router.post('/groups/find/paginate', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.find.paginate);


        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }



}).call(this);
