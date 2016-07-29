(function(){

    var allow = require('../access/accessMiddleware');
    var traitController = require('./traitController');
    var traitVersionController = require('./traitVersionController');
    var defaultTraitController = require('./defaultTraitController');


    module.exports.appendProtectedRoutes = function(router){
        //GET
        router.get('/traits/default/find/gender/:gender', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), defaultTraitController.find.gender);
        router.get('/traits/all', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), traitController.find.all);
        router.get('/traits/ennumerate/types', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), traitController.ennumerate.traitTypes);
        router.get('/traits/ennumerate/placements', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), traitController.ennumerate.placements);
        router.get('/traits/version', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), traitVersionController.getVersion);
        router.get('/traits/:id', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), traitController.find.one);


        router.get('/traits/default/all', allow([]), defaultTraitController.find.all);
        router.get('/traits/default/:id', allow([]), defaultTraitController.find.one);

        //POST
        router.post('/traits/create', allow([]), traitController.create);
        router.post('/traits/remove', allow([]), traitController.remove);
        router.post('/traits/update', allow([]), traitController.update);
        router.post('/traits/softDelete', allow([]), traitController.softDelete);
        router.post('/traits/paginate', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), traitController.find.paginate);
        router.post('/traits/query', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), traitController.find.query);


        router.post('/traits/default/create', allow([]), defaultTraitController.create);
        router.post('/traits/default/remove', allow([]), defaultTraitController.remove);
        router.post('/traits/default/update', allow([]), defaultTraitController.update);
        router.post('/traits/version', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), traitVersionController.leapVersion);
        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        return router;
    }



}).call(this);

