(function(){
    'use strict';

    var fs = require( 'fs' );
    var path = require( 'path' );
    var moment = require('moment');
    var config = require('../../config');
    var debug = require('./debug');


    module.exports.trashTmpFiles = function(){

        debug.info('Collecting...', 'green', false);
        var tmpDir = process.cwd() + "/lib/public/tmp/";
        // Loop through all the files in the temp directory
        fs.readdir( tmpDir, function( err, files ) {
            if( err ) {
                console.error( "Could not list the directory.", err );
            }

            files.forEach( function( file, index ) {

                var filePath = path.join( tmpDir, file );
                if (fileHasExpired(file)) fs.unlinkSync(filePath);

            } );
        } );

    };

    function fileHasExpired (fileName) {
        var unixts = fileName.split('_')[0];
        var then = moment.unix(unixts);
        var now = moment();

        if (now.diff(then, 'minutes') > config.keepTmpFilesFor) return true;

        return false;
    }

}).call(this);
