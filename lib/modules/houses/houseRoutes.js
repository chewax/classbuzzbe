(function(){

    var allow = require('../access/accessMiddleware');
    var houseController = require('./houseController');

    module.exports.appendProtectedRoutes = function(router){
        //GET
        router.get('/houses', allow(['customer-admin']), houseController.find.all);
        router.get('/houses/find/paginate', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), houseController.find.paginate);

        router.get('/houses/:id/events', allow(['customer-admin']), houseController.events.all);
        router.get('/houses/:id', allow(['customer-admin']), houseController.find.one);


        //POST
        router.post('/houses', allow(["customer-admin"]), houseController.create);
        router.delete('/houses', allow(["customer-admin"]), houseController.remove);
        router.put('/houses', allow(["customer-admin"]), houseController.update);
        router.get('/houses/:id/users', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), houseController.find.users);
        router.post('/houses/:id/events', allow(["customer-admin"]), houseController.update);
        router.get('/houses/customer/:id', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), houseController.find.byCustomer);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }


}).call(this);
