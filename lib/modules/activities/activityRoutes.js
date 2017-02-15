(function(){

    var allow = require('../access/accessMiddleware');
    var activityController = require('./activityController');

    module.exports.appendProtectedRoutes = function(router){

        //BASIC CRUD
        //Only super-admin can get all activities. All others must get their corresponding branch achievmenents
        router.get('/activities', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), activityController.find.all);
        router.put('/activities', allow(["customer-admin"]), activityController.update);
        router.get('/activities/customer/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), activityController.find.byCustomer);
        router.get('/activities/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), activityController.find.one);
        router.delete('/activities', allow(["branch-admin"]), activityController.remove);
        router.post('/activities', allow(["customer-admin", "branch-admin"]), activityController.create);
        router.post('/activities/paginate', allow(["customer-admin", "branch-admin"]), activityController.find.paginate);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }

}).call(this);
