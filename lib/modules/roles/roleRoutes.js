(function(){

    var allow = require('../access/accessMiddleware');
    var roleController = require('./roleController');


    module.exports.appendProtectedRoutes = function(router){

        //GET
        router.get('/roles', allow(["branch-admin", "customer-admin"]), roleController.findAll);


        //POST
        router.post('/roles/init', roleController.initDB);
        router.post('/roles', allow([]), roleController.createRole);
        router.post('/roles/find', allow(["customer-admin", "branch-admin"]), roleController.findByName);
        router.post('/roles/query', allow(["branch-admin", "customer-admin"]), roleController.query);
        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }


}).call(this);

