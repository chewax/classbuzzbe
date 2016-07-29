(function(){

    var errorController = require('./errorController');


    module.exports.appendProtectedRoutes = function(router){

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        router.get('/error/:id', errorController.renderErrorRecord);
        router.post('/logger', errorController.logError);

        return router;
    }

}).call(this);
