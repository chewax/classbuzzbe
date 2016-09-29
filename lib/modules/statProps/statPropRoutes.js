(function(){

    var allow = require('../access/accessMiddleware');
    var statPropController = require('./statPropController');
   

    module.exports.appendProtectedRoutes = function(router){

        //BASIC CRUD
        router.put('/statProps', allow([]), statPropController.update);
        router.post('/statProps', allow([]), statPropController.create);
        router.post('/statProps/paginate', allow([]), statPropController.paginate);
        router.delete('/statProps', allow([]), statPropController.remove);
        router.get('/statProps', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), statPropController.find);
        router.get('/statProps/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), statPropController.find);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){
        return router;
    }


}).call(this);

