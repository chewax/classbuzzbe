(function(){

    var allow = require('../access/accessMiddleware');
    var eventController = require('./eventController');

    module.exports.appendProtectedRoutes = function(router){

        //GET
        router.get('/events', allow(['customer-admin']), eventController.find.all);
        router.get('/events/:id', allow(['customer-admin']), eventController.find.one);


        //POST
        router.post('/events', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), eventController.apiCreate);
        router.delete('/events', allow(["branch-admin", "customer-admin", "sub-branch-admin"]), eventController.remove);
        router.get('/events/customer/:id', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), eventController.find.byCustomer);
        router.post('/events/query', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), eventController.find.query);
        router.post('/events/lazy', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), eventController.find.lazyLoad);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }

}).call(this);
