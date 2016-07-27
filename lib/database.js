(function () {

    'use strict';

    var Mongoose = require('mongoose');
    var _ = require('underscore');
    Mongoose.Promise = require('bluebird'); //Use bluebird...mongoose dont accept .catch

    var Config = require('./config');

    //load database
    if (_.isEmpty(Config.mongo_connection.username) || _.isUndefined(Config.mongo_connection.username)){
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

    console.log("Connecting to Database...");
    db.on('error', console.error.bind(console, 'connection error'));
    db.once('open', function callback() {
        console.log("Connection with Database success...");
    });

    exports.Mongoose = Mongoose;
    exports.db = db;

}).call(this);