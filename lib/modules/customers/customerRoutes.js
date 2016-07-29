(function(){

    var allow = require('../access/accessMiddleware');
    var customerController = require('./customerController');


    module.exports.appendProtectedRoutes = function(router){

        router.get('/customers', allow(['customer-admin']), customerController.find.all);
        router.get('/customers/:id/sorting/next', allow(["customer-admin", "branch-admin", "teacher", "student"]), customerController.getNextHouse);
        router.get('/customers/:id/houses', allow(['customer-admin']), customerController.houses.all);
        router.get('/customers/:id/branches', allow(['customer-admin']), customerController.branches.all);
        router.get('/customers/:id/admins', allow(['customer-admin']), customerController.admins.all);
        router.get('/customers/:id/logo', allow(['customer-admin']), customerController.getLogoURL);
        router.get('/customers/:id', allow(['customer-admin','branch-admin']), customerController.find.one);
        router.post('/customers', allow([]), customerController.create);
        router.delete('/customers', allow([]), customerController.remove);
        router.put('/customers', allow(["customer-admin"]), customerController.update);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }

}).call(this);
