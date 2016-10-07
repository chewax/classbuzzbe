(function(){
    'use strict';

    var fs = require( 'fs' );
    var path = require( 'path' );
    var moment = require('moment');


    module.exports.trashTmpFiles = function(){

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

        if (now.diff(then, 'minutes') > 30) return true;

        return false;
    }

}).call(this);
