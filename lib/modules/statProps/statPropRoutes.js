(function(){

    var allow = require('../access/accessMiddleware');
    var statPropController = require('./statPropController');

    module.exports.appendProtectedRoutes = function(router){

        return router;
    }

    module.exports.appendPublicRoutes = function(router){
        return router;
    }


}).call(this);

