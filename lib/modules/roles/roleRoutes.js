(function(){

    var allow = require('../access/accessMiddleware');
    var roleController = require('./roleController');

    module.exports.appendRoutes = function(router){

        //GET
        router.get('/roles/all', allow(["branch-admin", "customer-admin"]), roleController.findAll);


        //POST
        router.post('/roles/init', roleController.initDB);
        router.post('/roles/create', allow([]), roleController.createRole);
        router.post('/roles/find', allow([]), roleController.findByName);
        router.post('/roles/query', allow(["branch-admin", "customer-admin"]), roleController.query);
        return router;
    }

}).call(this);

