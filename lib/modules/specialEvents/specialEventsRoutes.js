(function(){

    var allow = require('../access/accessMiddleware');
    var specialEventsController = require('./specialEventsController');

    module.exports.appendProtectedRoutes = function(router){
        //BASIC CRUD
        router.put('/specialEvents', allow([]), specialEventsController.update);
        router.post('/specialEvents', allow([]), specialEventsController.create);
        router.delete('/specialEvents', allow([]), specialEventsController.remove);
        router.get('/specialEvents', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), specialEventsController.find);
        router.get('/specialEvents/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), specialEventsController.find);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){
        return router;
    }



}).call(this);

