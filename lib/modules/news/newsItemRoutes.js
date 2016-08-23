(function(){

    var allow = require('../access/accessMiddleware');
    var newsItemController = require('./newsItemController');

    module.exports.appendProtectedRoutes = function(router){

        //BASIC CRUD
        router.put('/news', allow([]), newsItemController.update);
        router.post('/news', allow([]), newsItemController.create);
        router.delete('/news', allow([]), newsItemController.remove);
        router.get('/news', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), newsItemController.find);
        router.get('/news/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), newsItemController.find);
        router.post('/news/lazy', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), newsItemController.getUserNews);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }



}).call(this);


