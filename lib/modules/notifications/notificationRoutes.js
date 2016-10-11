(function(){

    var allow = require('../access/accessMiddleware');
    var notificationController = require('./notificationController');

    module.exports.appendProtectedRoutes = function(router){

        //Notifications
        router.post('/notifications/remove', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), notificationController.remove);
        router.post('/notifications/read', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), notificationController.markAsRead);
        router.post('/notifications/user/:id/read/all', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), notificationController.markAllAsRead);
        router.post('/notifications/user/:id/lazy', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), notificationController.lazyLoad);

        //Find user notifications
        router.get('/notifications/user/:id', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), notificationController.findByUser);

        return router;

    };

    module.exports.appendPublicRoutes = function(router){

        return router;
    }

}).call(this);
