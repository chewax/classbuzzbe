(function(){

    var allow = require('../access/accessMiddleware');
    var groupController = require('./groupController');
    var groupLevelController = require('./groupLevelController');

    module.exports.appendRoutes = function(router){

        //GET
        router.get('/groups/all', allow(['customer-admin']), groupController.find.all);
        router.get('/groups/:customer/levels', allow(['customer-admin','branch-admin','teacher']), groupLevelController.find.all);
        router.get('/groups/:id/students', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.find.students);
        router.get('/groups/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.find.one);


        //POST
        router.post('/groups/create', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.create);
        router.post('/groups/remove', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.remove);
        router.post('/groups/update', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.update);
        router.post('/groups/getByBranch', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.find.byBranch);
        router.post('/groups/find/paginate', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), groupController.find.paginate);


        return router;
    }

}).call(this);
