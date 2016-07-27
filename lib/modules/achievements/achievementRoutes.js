(function(){

    var allow = require('../access/accessMiddleware');
    var achievementController = require('./achievementController');

    module.exports.appendRoutes = function(router){

        router.get('/achievements/all', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), achievementController.find.all);
        router.get('/achievements/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), achievementController.find.one);


        router.post('/achievements/create', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), achievementController.create);
        router.post('/achievements/remove', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), achievementController.remove);
        router.post('/achievements/search', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), achievementController.find.autocomplete);
        router.post('/achievements/paginate', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), achievementController.find.paginate);
        router.post('/achievements/find/byCustomer', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher", "student"]), achievementController.find.byCustomer);
        router.post('/achievements/update', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), achievementController.update);

        return router;
    }

}).call(this);
