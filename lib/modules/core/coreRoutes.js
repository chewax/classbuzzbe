(function(){

    var allow = require('../access/accessMiddleware');
    var apiController = require('./apiController');
    var aws = require('./aws');
    var utils = require('./utils');
    var dbupdates = require('./dbupdates');
    var multer  = require('multer');
    var upload = multer({ dest: __dirname + '/../../public/uploads/' });
    var appKeyController = require('../appKey/appKeyController');
    var api = require('./apiController');


    module.exports.appendProtectedRoutes = function(router){
        //GENERAL

        router.post('/upload', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), upload.any() , apiController.uploadFile);
        router.get('/s3/policy/:mimeType', aws.getS3Policy);
        router.post('/batchUploadTraits', utils.batchUploadTraits);
        router.post('/refactorTraits', dbupdates.refactorTraitPrices);
        router.post('/capitalizeNames', dbupdates.capitalizeNames);
        router.post('/addHatToHouse', dbupdates.addHatToHouseMembers);

        //APPKEY
        router.post('/appKey/create', allow([]), appKeyController.create);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        router.get('/', api.index);

        return router;
    }

}).call(this);
