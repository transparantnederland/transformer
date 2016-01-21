module.exports.transform = function( context, data ) {
	if( data.indexOf( 'lid' ) > -1 ) return 'tnl:member';

	if(
		data.indexOf( 'minister' ) > -1 ||
		data.indexOf( 'staatssecretaris' ) > -1 ||
		data.indexOf( 'voorzitter' ) > -1
	) return 'tnl:boardmember';

	console.log( data );
	process.exit();
};
