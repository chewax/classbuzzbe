(function(){

    var allow = require('../access/accessMiddleware');
    var adhocMailController = require('./adhocMailController');

    module.exports.appendRoutes = function(router){

        router.post('/mail/adhoc', allow(["customer-admin", "branch-admin", "teacher"]), adhocMailController.api.newAdHocProcess);

        return router;
    }

}).call(this);
