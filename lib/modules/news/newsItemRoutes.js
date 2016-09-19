(function(){

    var allow = require('../access/accessMiddleware');
    var newsItemController = require('./newsItemController');

    module.exports.appendProtectedRoutes = function(router){

        //BASIC CRUD
        router.put('/news', allow([]), newsItemController.update);

        router.delete('/news/:id/reaction/:reactionId', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), newsItemController.removeReaction);
        router.delete('/news/:id/comment/:commentId', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), newsItemController.removeComment);
        router.delete('/news/:id', allow([]), newsItemController.remove);

        router.get('/news', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), newsItemController.find);
        router.get('/news/:id', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), newsItemController.find);

        router.post('/news', allow([]), newsItemController.create);
        router.post('/news/lazy', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), newsItemController.getUserNews);
        router.post('/news/:id/reaction', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), newsItemController.addReaction);
        router.post('/news/:id/comment', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher", "student"]), newsItemController.addComment);


        return router;
    };

    module.exports.appendPublicRoutes = function(router){

        return router;
    }



}).call(this);


