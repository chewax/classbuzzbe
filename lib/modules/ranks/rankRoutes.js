(function(){

    var allow = require('../access/accessMiddleware');
    var rankController = require('./rankController');

    module.exports.appendProtectedRoutes = function(router){

        //BASIC CRUD
        router.put('/ranks', allow([]), rankController.update);
        router.post('/ranks', allow([]), rankController.create);
        router.delete('/ranks', allow([]), rankController.remove);
        router.get('/ranks', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), rankController.find);
        router.get('/ranks/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), rankController.find);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }


}).call(this);

