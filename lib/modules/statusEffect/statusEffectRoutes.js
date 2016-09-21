(function(){

    var allow = require('../access/accessMiddleware');
    var statusEffectController = require('./statusEffectController');

    module.exports.appendProtectedRoutes = function(router){
        //BASIC CRUD
        router.put('/statusEffects', allow([]), statusEffectController.update);
        router.post('/statusEffects', allow([]), statusEffectController.create);
        router.delete('/statusEffects', allow([]), statusEffectController.remove);
        router.get('/statusEffects', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), statusEffectController.find);
        router.get('/statusEffects/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), statusEffectController.find);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){
        return router;
    }



}).call(this);

