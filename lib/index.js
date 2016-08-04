(function () {

'use strict';

    var express = require('express');
    var app = express();
    var config = require('./config');
    var bodyParser = require('body-parser');
    var http = require('http').Server(app);
    var socketio = require('./modules/socket/socketController');
    var cors = require('./modules/core/cors');
    var protectedRoutes = require('./routes/protectedRoutes');
    var publicRoutes = require('./routes/publicRoutes');
    var errorHandler = require('./modules/errors/errorHandler');
    var favicon = require('serve-favicon');
    var aws = require('./modules/core/aws');
    var mailerMid = require('./modules/mailing/statusMailMiddlewares');
    var multer  = require('multer');
    var upload = multer({ dest: 'uploads/' });

    require('./modules/core/scheduler');
    require('./modules/core/objectExtensions');

    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

    //Serve Favicon
    app.use(favicon(__dirname + '/public/images/favicon.ico'));

    //Enable Cors
    app.use(cors());

    //User multi part forms on webhook routes
    app.use('/api/v2/webhooks/mailing/bounced', upload.any(), mailerMid.mailgunValidationMiddleware);
    app.use('/api/v2/webhooks/mailing/dropped', upload.any(), mailerMid.mailgunValidationMiddleware);

    //Body-parser on the rest
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.use('/api/v2/webhooks/mailing/opened',  mailerMid.mailgunValidationMiddleware);
    app.use('/api/v2/webhooks/mailing/delivered',  mailerMid.mailgunValidationMiddleware);

    //Serve Statics
    app.use(express.static(__dirname + '/public'));

    app.use('/api/v2/public', publicRoutes);
    app.use('/api/v2', protectedRoutes);
    app.use(errorHandler.handleUncaughtErrors);

    socketio.initSocketServer(http);
    http.listen(config.server.port);

}).call(this);