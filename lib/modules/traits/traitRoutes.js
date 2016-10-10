(function(){

    var allow = require('../access/accessMiddleware');
    var traitController = require('./traitController');
    var traitVersionController = require('./traitVersionController');
    var defaultTraitController = require('./defaultTraitController');


    module.exports.appendProtectedRoutes = function(router){
        //GET
        router.get('/traits/default/find/gender/:gender', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), defaultTraitController.find.gender);
        router.get('/traits', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), traitController.find.all);
        router.get('/traits/ennumerate/types', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), traitController.ennumerate.traitTypes);
        router.get('/traits/ennumerate/placements', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), traitController.ennumerate.placements);
        router.get('/traits/version', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), traitVersionController.getVersion);
        router.get('/traits/default', allow([]), defaultTraitController.find.all);
        router.get('/traits/default/:id', allow([]), defaultTraitController.find.one);
        router.get('/traits/:id', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), traitController.find.one);

        //POST
        router.post('/traits', allow([]), traitController.create);
        router.post('/traits/version', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), traitVersionController.leapVersion);
        router.post('/traits/paginate', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), traitController.find.paginate);
        router.post('/traits/query', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), traitController.find.query);
        router.post('/traits/default', allow([]), defaultTraitController.create);

        //DELETE
        router.delete('/traits', allow([]), traitController.remove);
        router.delete('/traits/soft', allow([]), traitController.softDelete);
        router.delete('/traits/default', allow([]), defaultTraitController.remove);

        //PUT
        router.put('/traits', allow([]), traitController.update);
        router.put('/traits/default', allow([]), defaultTraitController.update);


        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }



}).call(this);

