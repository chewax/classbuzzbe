(function(){

    var allow = require('../access/accessMiddleware');
    var questController = require('./questController');

    module.exports.appendRoutes = function(router){

        //GET
        router.get('/quest/all', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), questController.find.all);
        router.get('/quest/:id', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), questController.find.one);


        //POST
        router.post('/quest/create', allow(["branch-admin", "customer-admin"]), questController.create);
        router.post('/quest/remove', allow(["branch-admin", "customer-admin"]), questController.remove);
        router.post('/quest/update', allow(["branch-admin", "customer-admin"]), questController.update);

        return router;
    }

}).call(this);

