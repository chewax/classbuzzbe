(function(){

    var allow = require('../access/accessMiddleware');
    var skillController = require('./skillController');

    module.exports.appendProtectedRoutes = function(router){
        //BASIC CRUD
        router.put('/skills', allow([]), skillController.update);
        router.post('/skills', allow([]), skillController.create);
        router.delete('/skills', allow([]), skillController.remove);
        router.get('/skills', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), skillController.find);
        router.get('/skills/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), skillController.find);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }



}).call(this);

