(function(){

    var allow = require('../access/accessMiddleware');
    var seasonController = require('./seasonController');

    module.exports.appendProtectedRoutes = function(router){
        //BASIC CRUD
        router.put('/seasons', allow([]), seasonController.update);
        router.post('/seasons', allow([]), seasonController.create);
        router.delete('/seasons', allow([]), seasonController.remove);
        router.get('/seasons', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), seasonController.find);
        router.get('/seasons/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), seasonController.find);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }



}).call(this);


