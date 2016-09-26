(function(){

    var allow = require('../access/accessMiddleware');
    var attributeController = require('./attributeController');

    module.exports.appendProtectedRoutes = function(router){
        //BASIC CRUD
        router.put('/attributes', allow([]), attributeController.update);
        router.post('/attributes', allow([]), attributeController.create);
        router.delete('/attributes', allow([]), attributeController.remove);
        router.get('/attributes', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), attributeController.find);
        router.get('/attributes/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), attributeController.find);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){
        return router;
    }



}).call(this);

