(function(){

    var allow = require('../access/accessMiddleware');
    var chestController = require('./chestController');

    module.exports.appendProtectedRoutes = function(router){
        //BASIC CRUD
        router.put('/chests', allow([]), chestController.update);
        router.post('/chests', allow([]), chestController.create);
        router.delete('/chests', allow([]), chestController.remove);
        router.get('/chests', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), chestController.find);
        router.get('/chests/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), chestController.find);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){
        return router;
    }



}).call(this);

