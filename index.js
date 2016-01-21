//require( 'fs' ).unlinkSync( './schemas/tnl_schema.yaml.db' );

var _ =  require( 'underscore' ),
	bb = require( 'bumblebee' ),
	request = require( 'request' ),
	async = require( 'async' ),
  postProcessor = require('./postProcessor'),
  receiveHandlers = require('./receiveHandlers');

process.env.test = 2;

var serverOptions = {
		port: 3003
	},
	environment = bb.environment;

environment.name = 'TNL Uploader';

bb.bb.setSchemaPath( 'tnl_schema.yaml' );
bb.bb.setPostProcessor( postProcessor );
bb.bb.setReceiveHandlers( receiveHandlers );

bb.server.init( serverOptions, environment, function( err, app, server ){
	console.log( err || 'server running' );
});
