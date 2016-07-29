(function(){

    var allow = require('../access/accessMiddleware');
    var adhocMailController = require('./adhocMailController');

    module.exports.appendProtectedRoutes = function(router){

        router.post('/mail/adhoc', allow(["customer-admin", "branch-admin", "teacher"]), adhocMailController.api.newAdHocProcess);
        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }

}).call(this);
