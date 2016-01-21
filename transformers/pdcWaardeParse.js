var ignoredValues = [
			'J. van Leeuwen  Johanna (Hannie)',
			'Delft',
			'opleiding voor maatschappelijk werkster',
			'maatschappelijk werkster gemeente Rijswijk',
		],
		fixedPositions = {
			'lid Tweede Kamer der Staten-Generaal': {
				organizationName: 'Tweede Kamer',
				organizationType: 'tnl:Public',
				relationType: 'tnl:member'
			}
		},
		knownPositionNames = [
			'ambtenaar',
			'medewerker',
			'medewerkster',
			'vertaler',
			'vertaalster',
		],
		politicalParties = [
			'ARP',
			'CDA'
		],
		knownStudies = [
			'sociologie'
		],
		parensRegex = /\(([^\)]+)\)/g;

module.exports.transform = function( context, data ) {
	if( ignoredValues.indexOf( data ) > -1 ) {
		return {};
	}

	var parenthesed = parensRegex.exec( data ),
			organizationType = 'tnl:Organization',
			split, index;

	if( parenthesed ) data = data.replace( parensRegex, '' ).trim().replace( /  /g, ' ' );

	if( ignoredValues.indexOf( data ) > -1 ) {
		return {};
	}

	if( fixedPositions[ data ] ) return fixedPositions[ data ];

	if( politicalParties.indexOf( data ) > -1 ){
		organizationType = 'tnl:PoliticalParty';

		return {
			organizationName: data,
			organizationType: organizationType,
			relationType: 'tnl:member'
		};
	}

	if( data.indexOf( 'lid gemeenteraad van ') === 0 ) {
		return {
			organizationName: 'Gemeente ' + data.replace( 'lid gemeenteraad van ', '' ),
			organizationType: 'tnl:Public',
			relationType: 'member'
		};
	}

	split = data.split( ' ' );

	if( split[ 0 ] === 'studie' ) {

		if( knownStudies.indexOf( split[ 1 ] ) === 0 ) {
			return {
				organizationName: split.slice( 2 ),
				organizationType: organizationType,
				relationType: 'tnl:related'
			};
		}
	}

	if( knownPositionNames.indexOf( split[ 0 ] ) > -1 ) {
		index = split.indexOf( 'te' );
		if( index ) split = split.slice( 1, index );

		if( split[ 0 ] === 'afdeling' ){
			split = split.slice( 1 );
			if( split[ 0 ][ split[ 0 ].length - 1 ] === ',' ) split = split.slice( 1 );
		}

		if( split[ 0 ].indexOf( 'dienst' ) > -1 ) split = split.slice( 1 );

		return {
			organizationName: split.join( ' ' ),
			organizationType: organizationType,
			relationType: 'tnl:employee'
		};
	}

	afterComma = data.split( ',' )[ 1 ];

	if( afterComma ) return {
		organizationName: afterComma,
		organizationType: organizationType,
		relationType: 'tnl:employee'
	};

	console.log( data );
	process.exit();
};
