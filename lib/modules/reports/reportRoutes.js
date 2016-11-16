(function(){

    var allow = require('../access/accessMiddleware');
    var reportController = require('./reportController');


    module.exports.appendProtectedRoutes = function(router){

        router.post('/reports', allow(["branch-admin", "customer-admin"]), reportController.renderReport);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }


}).call(this);

