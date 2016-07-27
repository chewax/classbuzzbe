(function(){

    var allow = require('../access/accessMiddleware');
    var messageController = require('./messageController');

    module.exports.appendRoutes = function(router){

        //MESSAGES
        router.post('/messages/remove', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), messageController.remove);
        router.post('/messages/markAsRead', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), messageController.markAsRead);

        return router;
    }

}).call(this);
