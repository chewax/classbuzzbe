(function(){

    var allow = require('../access/accessMiddleware');
    var messageController = require('./messageController');

    module.exports.appendProtectedRoutes = function(router){

        //MESSAGES
        router.post('/messages/remove', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), messageController.remove);
        router.post('/messages/read', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), messageController.markAsRead);

        //FIND USER MESSAGES
        router.get('/messages/user/:id', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), messageController.findByUser);

        return router;

    };

    module.exports.appendPublicRoutes = function(router){

        return router;
    }

}).call(this);
