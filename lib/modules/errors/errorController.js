(function () {
    'use strict';

    var errorModel = require('./errorModel');
    var errorHandler = require('./errorHandler');

    module.exports.logError = function(req, res){

        errorHandler.handleError(req.body.err);
        res.status(200).send('Error logged correctly');
    };

    module.exports.renderErrorRecord = function(req, res) {
        errorModel.findOne({_id:req.params.id})
            .then(function(errorRecord){
                res.render('logErrorView', {
                    status: errorRecord.status,
                    user: errorRecord.user,
                    origin: errorRecord.origin,
                    message: errorRecord.message,
                    reason: errorRecord.reason,
                    timestamp: errorRecord.timestamp,
                    stack: errorRecord.stack
                });
            })
    }

}).call(this);
