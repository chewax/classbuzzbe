(function(){

    var allow = require('../access/accessMiddleware');
    var messageController = require('./messageController');

    module.exports.appendProtectedRoutes = function(router){

        //MESSAGES
        router.post('/messages/remove', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), messageController.remove);
        router.post('/messages/read', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), messageController.markAsRead);

        return router;

    };

    module.exports.appendPublicRoutes = function(router){

        return router;
    }

}).call(this);
