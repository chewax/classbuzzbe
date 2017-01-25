(function () {

    'use strict';

    var Mongoose = require('mongoose');
    Mongoose.Promise = require('bluebird'); //Use bluebird...mongoose does not accept .catch
    var Config = require('./config');
    var _ = require('lodash');
    require('Colors');

    var lastModPlugin = require('./modules/core/plugins/lastModifiedPlugin');
    var findOneOrCreatePlugin = require('./modules/core/plugins/findOneOrCreatePlugin');

    //load database
    if (_.isEmpty(Config.mongo_connection.username) || _.isNil(Config.mongo_connection.username)){
        Mongoose.connect('mongodb://' + Config.mongo_connection.url + '/' + Config.mongo_connection.database);
    }
    else {

        var options = {
            db: { native_parser: true },
            server: { poolSize: 10 },
            user: Config.mongo_connection.username,
            pass: Config.mongo_connection.password,
            auth: {
                authdb: 'admin'
            }
        };

        var url = 'mongodb://'+Config.mongo_connection.url+':'+Config.mongo_connection.port+'/'+Config.mongo_connection.database;

        Mongoose.connect(url, options);
    }

    var db = Mongoose.connection;

    console.log("[classbuzz] Connecting to Database...".grey);
    db.on('error', console.error.bind(console, 'connection error'));
    db.once('open', function callback() { console.log("[classbuzz] Connection success!!!".grey); });

    //Add Global Plugins before returning...
    Mongoose.plugin(lastModPlugin);
    Mongoose.plugin(findOneOrCreatePlugin);

    exports.Mongoose = Mongoose;
    exports.db = db;

}).call(this);