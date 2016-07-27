(function(){

    var allow = require('../access/accessMiddleware');
    var eventController = require('./eventController');

    module.exports.appendRoutes = function(router){

        //GET
        router.get('/events/all', allow(['customer-admin']), eventController.find.all);
        router.get('/events/:id', allow(['customer-admin']), eventController.find.one);


        //POST
        router.post('/events/create', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), eventController.apiCreate);
        router.post('/events/remove', allow(["branch-admin", "customer-admin", "sub-branch-admin"]), eventController.remove);
        router.post('/events/find/byCustomer', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), eventController.find.byCustomer);
        router.post('/events/find/query', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), eventController.find.query);
        router.post('/events/find/lazyLoad', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), eventController.find.lazyLoad);

        return router;
    }

}).call(this);
