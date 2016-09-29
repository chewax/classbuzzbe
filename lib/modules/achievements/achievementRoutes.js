(function(){

    var allow = require('../access/accessMiddleware');
    var achievementController = require('./achievementController');


    module.exports.appendProtectedRoutes = function(router){

        //BASIC CRUD
        router.put('/achievements', allow([]), achievementController.update);
        router.post('/achievements', allow([]), achievementController.create);
        router.delete('/achievements', allow([]), achievementController.remove);

        router.get('/achievements', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), achievementController.find);
        router.get('/achievements/customer/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), achievementController.findByCustomer);
        router.get('/achievements/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), achievementController.find);

        router.post('/achievements/paginate', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), achievementController.paginate);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }

}).call(this);
