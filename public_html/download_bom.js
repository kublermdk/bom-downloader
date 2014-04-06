var http = require( 'http' );
var fs = require( 'fs' );
var moment = require( 'moment' );
var underscore = require( 'underscore-node' );
// _.uniqueId('contact_');

var dateFormat = 'YYYYMMDDHH';
var baseHTTP = 'http://';
var baseHost = 'www.bom.gov.au';
var baseImg = 'IDE00135.';
var basePath = '/gms/' + baseImg;
var folder = 'satImages/';
//var currentTime = moment().utc().format( 'YYYYMMDDHHMM' );
//var downloadURL = baseURL + moment().utc().subtract( 5, 'hours' ).format( 'YYYYMMDDHH' ) + "30.jpg";
// 2014 04 05 0630 - Year, Month, Day, Hour, 30 Min
/*
 * http://www.bom.gov.au/gms/IDE00135.201404050630.jpg
 * 
 * http://www.bom.gov.au/gms/IDE00135.201404060630.jpg
 * http://www.bom.gov.au/gms/IDE00135.201404060530.jpg
 */

var createNamePath = function( _time ) {
    if ( !_time || typeof _time == 'undefined' ) {
        _time = moment().utc().subtract( 5, 'hours' );
    }
    return  _time.format( dateFormat ) + "30.jpg";
};
var createPath = function( _time ) {
    return  basePath + createNamePath( _time );
};
var createURL = function( _time ) {
    return baseHTTP + baseHost + basePath + createNamePath( _time );
};
var createFilename = function( _time ) {
    return folder + baseImg + createNamePath( _time );
};

fs.exists( folder, function( exists ) { // Folder exists?
    if ( !exists ) {
        fs.mkdirSync( folder, 0755, function( e ) { // Create the images folder as it doesn't exist
            if ( e ) {
                console.log( "Error creating the folder " + folder + " : ", e );
            }
        } );
    }
} );


http.createServer( function( req, res ) {
    res.writeHead( 200, {'Content-Type' : 'text/html'} );
    var downloadURL = createURL();
    res.end( '<h1>BOM.gov.au image downloader</h1>\n<a href="' + downloadURL + '" target="_blank">' + downloadURL + '<br /><img src="' + downloadURL + '" />' );
} ).listen( 3000 );
console.log( 'Server running at http://127.0.0.1:3000/' );
console.log( 'The current time is : ' + moment().utc().format( 'YYYYMMDDHHMM' ) );
console.log( 'The URL to download is : ' + createURL() );


/*
 var downloadOpts = {
 host : 'www.bom.gov.au',
 port : 80,
 path : createPath(),
 method : 'GET'
 };
 console.log( "Going to download using : ", downloadOpts );
 var imageData;
 var downloadReq = http.request( downloadOpts, function( res ) {
 console.log( res );
 res.on( 'data', function( data ) {
 console.log( data );
 imageData += data;
 } );
 console.log( "== The imageData is : ", imageData );
 res.on( 'end', function( data ) {
 imageData += data;
 var filehandle = fs.writeFile( createFilename(), imageData, function( err ) {
 if ( err ) {
 console.log( "Couldn't write the file ", createFilename() );
 } else {
 "Saved the image to : ", createFilename();
 }
 } );
 } );
 } );
 downloadReq.end();
 */


var download = function( url, dest, cb ) {
    var file = fs.createWriteStream( dest );
    var request = http.get( url, function( response ) {
        response.pipe( file );
        file.on( 'finish', function() {
            console.log( "Finished saving the file : ", dest );
            file.close();
            cb(); // close() is async, call cb after close completes.
        } );
    } );
};


startDownloader = function() { // This should automatically download a new image every hour.
    fs.exists( createFilename(), function( exists ) { // Folder exists?
        if ( !exists ) {
            download( createURL(), createFilename(), function() {
                console.log( "Hourly image downloaded : " + createFilename() );
            } );
        } else {
            console.log( "You've already downloaded " + createFilename() );
        }
    } );
    underscore.delay( function() {
        startDownloader();
    }, 3600000 );
};

stillRunning = function() { // Runs every 10mins
    console.log( "." );
    underscore.delay( stillRunning(), 600000 );
};

var checkPreviousDownloads = function() {
// This should check the last 48hrs worth of images and ensure the appropriate images exist.

    timeNow = moment().utc().subtract( 5, 'hours' );
    underscore.each( underscore.range( 0, 48 ), function( value, key ) {
        var time = timeNow.subtract( value, 'hours' );
        var filename = createFilename( time );
        var url = createURL( time );
        //console.log( "The previous " + value + " hrs ago downloads filename and url is : ", filename, url );
        fs.exists( filename, function( exists ) { // Folder exists?
            if ( !exists ) {
                console.log( "The previous downloads file " + filename + " doesn't exist. Downloading : " + url );
                underscore.delay( function( url, filename ) {
                    if ( url && url !== '' && filename && filename !== '' ) {
                        download( url, filename, function() {
                            console.log( "Finished downloading : " + filename );
                        } );
                    }
                }, (value * 900), url, filename );
                /*
                 fs.mkdirSync( folder, 0755, function( e ) { // Create the images folder as it doesn't exist
                 if ( e ) {
                 console.log( "Error creating the folder " + folder + " : ", e );
                 }
                 } );
                 */
            } else {
                console.log( "The file exists : ", createFilename( timeNow.subtract( value, 'hours' ) ) );
            }
        } );
    } );
};
checkPreviousDownloads();
startDownloader(); // Start the image downloading
stillRunning(); // Outputs a dot every 10mins
//console.log( "Finished and hopefully the file " + createFilename() + " has been created" );



