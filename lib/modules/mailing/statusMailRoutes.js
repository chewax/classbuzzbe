(function(){

    var allow = require('../access/accessMiddleware');
    var malingController = require('./statusMailController');

    module.exports.appendRoutes = function(router){

        router.get('/statusMail/:date', allow(["customer-admin", "branch-admin", "teacher"]), malingController.api.getAllRecords);

        router.post('/statusMail/records/:id', allow(["customer-admin", "branch-admin", "teacher"]), malingController.api.paginateRecords);
        router.post('/statusMail/records', allow(["customer-admin", "branch-admin", "teacher"]), malingController.api.getRecordDates);

        return router;
    }

}).call(this);