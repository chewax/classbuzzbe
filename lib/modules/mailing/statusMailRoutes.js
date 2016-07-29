(function(){

    var allow = require('../access/accessMiddleware');
    var malingController = require('./statusMailController');
    var mailingWebhook = require('./statusMailWebhooks');

    module.exports.appendProtectedRoutes = function(router){

        router.get('/statusMail/:date', allow(["customer-admin", "branch-admin", "teacher"]), malingController.api.getAllRecords);
        router.post('/statusMail/records', allow(["customer-admin", "branch-admin", "teacher"]), malingController.api.getRecordDates);
        router.post('/statusMail/records/:id', allow(["customer-admin", "branch-admin", "teacher"]), malingController.api.paginateRecords);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        router.post('/webhooks/mailing/delivered', mailingWebhook.delivered);
        router.post('/webhooks/mailing/opened', mailingWebhook.opened);
        router.post('/webhooks/mailing/bounced', mailingWebhook.bounced);
        router.post('/webhooks/mailing/dropped', mailingWebhook.dropped);

        return router;
    }

}).call(this);