(function () {
    'use strict';

    var express = require('express');
    var userController = require('../modules/users/userController');
    var branchController = require('../modules/branches/branchController');
    var errorController = require('../modules/errors/errorController');
    var mailingWebhook = require('../modules/mailing/statusMailWebhooks');
    var auth = require('../modules/access/authController');
    var api = require('../modules/core/apiController');
    var aws = require('../modules/core/aws');

    var router = express.Router();

    // GETs
    // =====================================================
    router.get('/public-branches/all' , branchController.find.publicAll);
    router.get('/users/exist/:doc' , userController.find.exists);
    router.get('/credentials/recovery', auth.recoveryForm);
    router.get('/credentials/reset/:token', auth.resetForm);
    router.get('/branches/registerCode/:rcode', branchController.find.byRegisterCode);
    router.get('/feed', api.renderLiveFeed);
    router.get('/usernameCheck/:username', auth.usernameCheck);
    router.get('/error/:id', errorController.renderErrorRecord);
    router.get('/', api.index);

    // POSTs
    // =====================================================
    router.post('/authenticate', auth.authenticate);
    router.post('/impersonate', auth.impersonate);
    router.post('/students/create', userController.newStudent);
    router.post('/parents/create', userController.parent.new);
    router.post('/credentials/recovery', auth.forgotPassword);
    router.post('/credentials/reset/:token', auth.resetPassword);
    router.post('/s3Policy', aws.getS3Policy);
    router.post('/logger', errorController.logError);


    //WEBHOOKS
    // =====================================================
    router.post('/webhooks/mailing/delivered', mailingWebhook.delivered);
    router.post('/webhooks/mailing/opened', mailingWebhook.opened);
    router.post('/webhooks/mailing/bounced', mailingWebhook.bounced);
    router.post('/webhooks/mailing/dropped', mailingWebhook.dropped);

    module.exports = router;

}).call(this);

