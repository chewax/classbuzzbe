(function(){

    var allow = require('../access/accessMiddleware');
    var newsItemController = require('./newsItemController');

    module.exports.appendProtectedRoutes = function(router){
        //BASIC CRUD
        router.put('/newsItems', allow([]), newsItemController.update);
        router.post('/newsItems', allow([]), newsItemController.create);
        router.delete('/newsItems', allow([]), newsItemController.remove);
        router.get('/newsItems', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), newsItemController.find);
        router.get('/newsItems/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), newsItemController.find);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }



}).call(this);


