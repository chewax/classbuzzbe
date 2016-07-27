(function(){

    var allow = require('../access/accessMiddleware');
    var customerController = require('./customerController');

    module.exports.appendRoutes = function(router){

        //GET
        router.get('/customers/all', allow(['customer-admin']), customerController.find.all);
        router.get('/customers/:id/sorting/next', allow(["customer-admin", "branch-admin", "teacher", "student"]), customerController.getNextHouse);
        router.get('/customers/:id/houses/all', allow(['customer-admin']), customerController.houses.all);
        router.get('/customers/:id/branches/all', allow(['customer-admin']), customerController.branches.all);
        router.get('/customers/:id/admins/all', allow(['customer-admin']), customerController.admins.all);
        router.get('/customers/:id/logourl', allow(['customer-admin']), customerController.getLogoURL);
        router.get('/customers/:id', allow(['customer-admin','branch-admin']), customerController.find.one);


        //POST
        router.post('/customers/create', allow([]), customerController.create);
        router.post('/customers/remove', allow([]), customerController.remove);
        router.post('/customers/update', allow(["customer-admin"]), customerController.update);

        return router;
    }

}).call(this);
