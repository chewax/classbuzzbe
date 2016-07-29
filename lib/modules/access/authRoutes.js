(function(){

    var auth = require('./authController');


    module.exports.appendProtectedRoutes = function(router){

        return router;
    }

    module.exports.appendPublicRoutes = function(router){

        router.get('/credentials/recovery', auth.recoveryForm);
        router.get('/credentials/reset/:token', auth.resetForm);
        router.get('/username/available/:username', auth.usernameCheck);
        router.post('/authenticate', auth.authenticate);
        router.post('/impersonate', auth.impersonate);
        router.post('/credentials/recovery', auth.forgotPassword);
        router.post('/credentials/reset/:token', auth.resetPassword);

        return router;
    }

}).call(this);