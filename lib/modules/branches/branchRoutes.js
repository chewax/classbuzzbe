(function(){

    var allow = require('../access/accessMiddleware');
    var branchController = require('./branchController');


    module.exports.appendProtectedRoutes = function(router){

        //GET

        router.get('/branches', allow(['customer-admin']), branchController.find.all);
        router.get('/branches/:id', allow(['customer-admin']), branchController.find.one);
        router.get('/branches/:id/events', allow(['customer-admin']), branchController.events.all);
        router.get('/branches/:id/events/query', allow(['customer-admin']), branchController.events.query);


        // POST
        router.post('/branches', allow(["customer-admin"]), branchController.create);
        router.delete('/branches', allow(["customer-admin"]), branchController.remove);
        router.put('/branches', allow(["customer-admin", "branch-admin"]), branchController.update);
        router.post('/branches/findSome', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), branchController.find.some);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        router.get('/branches' , branchController.find.publicAll);
        router.get('/branches/registration/:code', branchController.find.byRegisterCode);

        return router;
    }

}).call(this);
