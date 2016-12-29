(function(){

    var allow = require('../access/accessMiddleware');
    var messageController = require('./messageController');
    var userController = require('../users/userController');


    module.exports.appendProtectedRoutes = function(router){

        router.get('/message/conversation', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), messageController.getConversation);
        router.get('/message/board/:id', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), messageController.getBoard);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }

}).call(this);
