(function(){

    var allow = require('../access/accessMiddleware');
    var questController = require('./questController');
    var questGoalController = require('./questGoalController');


    module.exports.appendProtectedRoutes = function(router){
        //GET
        router.get('/quest', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), questController.find.all);
        router.get('/quest/:id', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), questController.find.one);


        //POST
        router.post('/quest', allow(["branch-admin", "customer-admin"]), questController.create);
        router.delete('/quest', allow(["branch-admin", "customer-admin"]), questController.remove);
        router.put('/quest', allow(["branch-admin", "customer-admin"]), questController.update);


        router.post('/quest_goal', allow(["branch-admin", "customer-admin"]), questGoalController.create);
        router.put('/quest_goal', allow(["branch-admin", "customer-admin"]), questGoalController.update);
        router.delete('/quest_goal', allow(["branch-admin", "customer-admin"]), questGoalController.remove);
        router.get('/quest_goal', allow(["branch-admin", "customer-admin"]), questGoalController.find.all);
        router.get('/quest_goal/:id', allow(["branch-admin", "customer-admin"]), questGoalController.find.one);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }

}).call(this);

