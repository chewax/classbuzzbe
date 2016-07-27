(function(){

    var allow = require('../access/accessMiddleware');
    var branchController = require('./branchController');

    module.exports.appendRoutes = function(router){

        //GET
        router.get('/branches/all', allow(['customer-admin']), branchController.find.all);
        router.get('/branches/:id/events/all', allow(['customer-admin']), branchController.events.all);
        router.get('/branches/:id/events/query', allow(['customer-admin']), branchController.events.query);
        router.get('/branches/:id', allow(['customer-admin']), branchController.find.one);


        // POST
        router.post('/branches/create', allow(["customer-admin"]), branchController.create);
        router.post('/branches/remove', allow(["customer-admin"]), branchController.remove);
        router.post('/branches/update', allow(["customer-admin", "branch-admin"]), branchController.update);
        router.post('/branches/findSome', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), branchController.find.some);

        return router;
    }

}).call(this);
