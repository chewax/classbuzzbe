(function(){

    var allow = require('../access/accessMiddleware');
    var houseController = require('./houseController');

    module.exports.appendRoutes = function(router){

        //GET
        router.get('/houses/all', allow(['customer-admin']), houseController.find.all);
        router.get('/houses/:id/events/all', allow(['customer-admin']), houseController.events.all);
        router.get('/houses/:id/events/query', allow(['customer-admin']), houseController.events.query);
        router.get('/houses/:id', allow(['customer-admin']), houseController.find.one);


        //POST
        router.post('/houses/create', allow(["customer-admin"]), houseController.create);
        router.post('/houses/remove', allow(["customer-admin"]), houseController.remove);
        router.post('/houses/update', allow(["customer-admin"]), houseController.update);
        router.post('/houses/:id/users', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), houseController.find.users);
        router.post('/houses/:id/events/create', allow(["customer-admin"]), houseController.update);
        router.post('/houses/find/byCustomer', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), houseController.find.byCustomer);
        router.post('/houses/find/paginate', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), houseController.find.paginate);

        return router;
    }

}).call(this);
