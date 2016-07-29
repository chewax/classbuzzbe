(function(){

    var allow = require('../access/accessMiddleware');
    var activityController = require('./activityController');

    module.exports.appendProtectedRoutes = function(router){

        //BASIC CRUD
        //Only super-admin can get all activities. All others must get their corresponding branch achievmenents
        router.get('/activities', allow([]), activityController.find.all);
        router.put('/activities', allow(["customer-admin"]), activityController.update);
        router.post('/activities', allow(["branch-admin"]), activityController.create);
        router.delete('/activities', allow(["branch-admin"]), activityController.remove);

        router.get('/activities/customer/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), activityController.find.byCustomer);
        router.get('/activities/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), activityController.find.one);

        router.post('/activities/search', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), activityController.find.autocomplete);
        router.post('/activities/paginate', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), activityController.find.paginate);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }

}).call(this);
