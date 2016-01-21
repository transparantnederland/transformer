var locations = require('../locations'),
		skipWords = [
			'van',
			'de',
			'in',
			'voor'
		],
		parensRegex = /\(([^\)]+)\)/g,
		noInterpunctionRegex = /([\w|-]+)/;

module.exports.transform = function( context, data ){
	if( !data ) return {};

	var apps = approaches.slice(),
			result;

	// convert uri style function notations
	if( /^http/.exec( data ) ) data = data.split( '/' ).pop().replace(/_/g, ' ');
	
	while( apps.length && !result ) result = apps.shift()( context, data );

	if( result ) {
		if( !result.organization || result.organization.indexOf( 'undefined' ) > -1 ) {
			console.log( result, apps, context.dataByColumnName );
			process.exit();
		}
		return result;
	} else {
		context.markNextAsInvalid = true;
		// if( !module.exports.test ) {
		// 	console.log(
		// 		'no result...',
		// 		context.dataByColumnName,
		// 		data
		// 	);
		// 	process.exit();
		// }
		return {
			relation: 'tnl:related',
			organization: data,
			organizationType: 'tnl:Organization'
		};
	}
};

var approaches = [
	getSpecificPosition,
	getStatenGeneraal,
	getProvincialPosition,
	getMunicipalPosition,
	getLocationRelation,
	getKnownPartyFromVerbose,
	getEuroParliamentMembership,
	getPositionAtParty,
	getOrphanedPosition,
	getMinisterPosition,
	getOtherMemberships,
	getMinistryPosition
];

var specificPositions = {
	'minister-president': {
		relation: 'tnl:boardmember',
		organization: 'Ministerie van Algemene Zaken',
		organizationType: 'tnl:Public'
	},
	'informateur': {
		relation: 'tnl:advisor',
		organization: 'Regering',
		organizationType: 'tnl:Public'
	},
	'lid bestuur vereniging oud-leden tweede kamer': {
		relation: 'tnl:boardmember',
		organization: 'Vereniging oud-leden Tweede Kamer',
		organizationType: 'tnl:NonProfit'
	},
	'lid externe commissie Tweede Kamer inzake herindeling ministeries en herbezinning overheidstaken (Commissie-Wiegel)': {
		relation: 'tnl:member',
		organization: 'Commissie-Wiegel',
		organizationType: 'tnl:Public'
	},
	'assistent-griffier Tweede Kamer der Staten-Generaal': {
		relation: 'tnl:employee',
		organization: 'Tweede Kamer',
		organizationType: 'tnl:Public'
	},
	'lid externe commissie Tweede Kamer inzake verkiezing/benoemingsprocedure burgemeester (Commissie-Van Thijn)': {
		relation: 'tnl:member',
		organization: 'Commissie-van Thijn',
		organizationType: 'tnl:Public'
	},
	'lid externe commissie Tweede Kamer inzake verkiezing/benoeming burgemeester (comissie-Van Thijn)': {
		relation: 'tnl:member',
		organization: 'Commissie-van Thijn',
		organizationType: 'tnl:Public'
	}
};

// make sure they all have lowercase keys
Object.keys( specificPositions).forEach( function( key ) {
	var value = specificPositions[ key ];
	delete specificPositions[ key ];
	specificPositions[ key.toLowerCase() ] = value;
});

specificPositions[ 'minister-president van nederland' ] = specificPositions[ 'minister-president' ];

/* parses the strings as they are keys of specificPositions object above */
function getSpecificPosition( context, data ) {
	var item = specificPositions[ data.toLowerCase() ];
	return item;
}

/* parses strings like:
		Tweede Kamer
		Eerste Kamer
		Tweede Kamer der Staten Generaal
		Beleidsmedewerker SGP-Tweede Kamerfractie
		Campagneleider Tweede Kamer verkiezingen
		Lid fractiebestuur CDA Tweede Kamer
*/
function getStatenGeneraal( context, data ) {
	var searchResult = getFromAndBefore( 'Eerste Kamer', data ) || getFromAndBefore( 'Tweede Kamer', data ),
			output = {}, split;

	if( !searchResult) return;

	output.organization = searchResult.middle;
	output.organizationType = 'tnl:Public';

	if( !searchResult.before ||
		searchResult.before.toLowerCase() === 'lid' ||
		searchResult.before.toLowerCase() === 'lid van de' ||
		searchResult.before.toLowerCase() === 'tijdelijk lid' ||
		searchResult.before.toLowerCase().indexOf( 'lijsttrekker' ) > -1
	) {
		output.relation = 'tnl:member';
	} else if( searchResult.before.toLowerCase().indexOf( 'voorzitter' ) > -1 ) {
		output.relation = 'tnl:boardmember';
	} else if( searchResult.before.toLowerCase().indexOf( 'beleidsmedewerker' ) > -1 ){
		output.organization = context.dataByColumnName.partij;
		output.organizationType = 'tnl:PoliticalParty';
		output.relation = 'tnl:employee';
	} else if( searchResult.before.toLowerCase().indexOf( 'campagneleider' ) > -1 ) {
		output.organization = context.dataByColumnName.partij;
		output.organizationType = 'tnl:PoliticalParty';
		output.relation = 'tnl:advisor';
	} else if( searchResult.before.toLowerCase().indexOf( 'lid fractiebestuur' ) > -1 ) {
		output.organization = context.dataByColumnName.partij;
		output.organizationType = 'tnl:PoliticalParty';
		output.relation = 'tnl:boardmember';
	} else if( searchResult.before.toLowerCase().indexOf( 'fractieleider' ) > -1 ) {
		split = searchResult.before.split( ' ' );
		if( split.length > 1 ) {
			output.organization = split[ 1 ];
			output.organizationType = 'tnl:PoliticalParty';
			output.relation = 'tnl:member';
		} else {
			console.log( 'fractieleider deal', data, searchResult, context.dataByColumnName );
			process.exit();
		}
	} else {
		console.log( 'getStatenGeneraal', data, searchResult, context.dataByColumnName );
		process.exit();
		return;
	}

	return output;
}

/* parses strings like
     commissaris van de Koningin in Limburg
*/
function getProvincialPosition( context, data ) {
	var provinceCommisioner = /commissaris van de koningin in (.+)/i.exec( data ),
			province;

	if( provinceCommisioner ) {
		province = provinceCommisioner[ 1 ];

		if( locations.provinces.indexOf( province ) === -1 ) context.markNextAsInvalid = true;

		return {
			relation: 'tnl:boardmember',
			organization: 'Provincie ' + province,
			organizationType: 'tnl:Public'
		};
	}
}

/* parses strings like:
		Wethouder van Zoetermeer
*/
function getMunicipalPosition( context, data ) {
	var split = data.split(' '),
			//splitLC = split.map( toLowerCase ),
			position = split.shift().toLowerCase(),
			minicipalityIndex,
			possibleMunicipality,
			municipality;

	if( position === 'wethouder' || position === 'burgemeester' || position === 'raadslid' || position === 'duoraadslid' ) {
		while( skipWords.indexOf( split[ 0 ] ) > -1 ) split.shift();

		if( !split.length ) {
			// console.log( 'getMunicipalPosition', position, data );
			return;
		}

		possibleMunicipality = split.join( ' ' );

		while(
			municipalityIndex = locations.municipalities.indexOf( possibleMunicipality ) === -1 &&
			possibleMunicipality.split( ' ' ).length > 1
		) {
			split = possibleMunicipality.split( ' ' );
			split.pop();
			possibleMunicipality = split.join( ' ' );

			var possibleMunicipalityWithoutInterpunction = noInterpunctionRegex.exec( possibleMunicipality );

			possibleMunicipality = possibleMunicipalityWithoutInterpunction[ 1 ];
		}
		
		if( municipalityIndex === -1 ) {
			context.markNextAsInvalid = true;
			municipality = split.join(' ');
		} else municipality = possibleMunicipality;

		return {
			relation: 'tnl:boardmember',
			organization: 'Gemeente ' + municipality,
			organizationType: 'tnl:Public'
		};
	}
}

/* parses strings like
		Utrecht (provincie)
*/
function getLocationRelation( context, data ) {
	var parenthesed = parensRegex.exec( data ),
			isMunicipality, isProvince,
			name = '';

	if( parenthesed ) {
		data = data.replace( parensRegex, '' ).trim();
	}
	
	isMunicipality = locations.municipalities.indexOf( data ) > -1;
	isProvince = locations.provinces.indexOf( data ) > -1;

	if( isMunicipality && !isProvince ) name = 'Gemeente ';
	if( !isMunicipality && isProvince ) name = 'Provincie ';

	if( isMunicipality && isProvince ) {
		if( parenthesed ) {
			if( parenthesed[ 1 ].toLowerCase() === 'gemeente' ) name = 'Gemeente ';
			if( parenthesed[ 1 ].toLowerCase() === 'provincie' ) name = 'Provincie ';
		} else {
			name = '[Gemeente|Provincie] ';
			context.markNextAsInvalid = true;
		}
	}

	name += data;

	if( !isMunicipality && !isProvince ) {
		if( parenthesed && parenthesed[ 1 ] === 'plaats' ) {
			name += ' (plaats)';
			context.markNextAsInvalid = true;
		} else {
			return;
		}
	}

	return {
		relation: 'tnl:related',
		organization: name,
		organizationType: 'tnl:Public'
	};
}

var knownPartiesVerboseNames = {
			'Lijst Pim Fortuyn': 'LPF',
			'GroenLinks': 'GroenLinks'
		};

/* parses known party strings (above) */
function getKnownPartyFromVerbose( context, data ) {
	var party = knownPartiesVerboseNames[ data ];

	if( party ) {
		return {
			relation: 'tnl:member',
			organization: party,
			organizationType: 'tnl:PoliticalParty'
		};
	}
}

/* parses strings like: lid europees parlement, europees parlement */
function getEuroParliamentMembership( context, data ) {
	if(
		data.toLowerCase() === 'lid europees parlement' ||
		data.toLowerCase() === 'europees parlement'
	) {
		return {
			relation: 'tnl:member',
			organization: 'Europees Parlement',
			organizationType: 'tnl:Organization'
		};
	}
}

/* parses strings like:
		Lid partijbestuur SP
*/
function getPositionAtParty( context, data ) {
	var partijBestuurResult = getFromAndBefore( 'partijbestuur', data );
	
	if( partijBestuurResult ) {
		return {
			relation: 'tnl:boardmember',
			organization: partijBestuurResult.after || context.dataByColumnName.partij,
			organizationType: 'tnl:PoliticalParty'
		};
	}
}

var boardmemberPositions = [
			'secretaris',
			'fractievoorzitter',
			'politiek leider',
			'lijsttrekker',
			'partijvoorzitter'
		];

/* parses strings like:
		Secretaris
		Fractievorzitter
*/
function getOrphanedPosition( context, data ) {
	if( boardmemberPositions.indexOf( data.toLowerCase() ) > -1 ) {
		return {
			relation: 'tnl:boardmember',
			organization: context.dataByColumnName.partij,
			organizationType: 'tnl:PoliticalParty'
		};
	}

	if( data.toLowerCase().indexOf( 'dijkgraaf' ) > -1 ) {
		var waterschap = /((waterschap|hoogheemraadschap|wetterskip) [^,\.]+)/i.exec( data );

		if( waterschap ) waterschap = waterschap[ 1 ];
		else {
			context.markNextAsInvalid = true;
			doForOtherFields( context, searchForWaterschap );
		}

		return {
			relation: 'tnl:boardmember',
			organization: waterschap,
			organizationType: 'tnl:Public'
		};
	}

	if( data.toLowerCase() === 'gedeputeerde' ) {
		var province;

		doForOtherFields( context, lookForProvince );

		if( province ) {
			return {
				type: 'tnl:member',
				organization: 'Gedeputeerde Staten van ' + province,
				organizationType: 'tnl:Public'
			};
		}
	}

	function searchForWaterschap( fieldName, string ) {
		if( waterschap ) return;
		var result = /((waterschap|hoogheemraadschap|wetterskip)[^,\.]+)/i.exec( string );

		waterschap = result && result[ 1 ];
	}

	function lookForProvince( key, value ) {
		if( province ) return;

		var fromAndBefore = getFromAndBefore( 'gedeputeerde', value ),
				split;

		if( fromAndBefore ) {
			split = fromAndBefore.after.split( ' ' );
			if( split[ 0 ].toLowerCase() === 'staten' ) split.shift();
			if( split[ 0 ].toLowerCase() === 'van' ) split.shift();
			if( split[ 0 ].toLowerCase() === 'in' ) split.shift();
			if( split[ 0 ].toLowerCase() === 'de' ) split.shift();
			if( split[ 0 ].toLowerCase() === 'provincie' ) split.shift();

			var withoutInterpunction = noInterpunctionRegex.exec( split[ 0 ] );
			
			if( locations.provinces.indexOf( withoutInterpunction[ 1 ] ) > -1 ) province = withoutInterpunction[ 1 ];
			else console.log( withoutInterpunction, locations.provinces );
		}
	}
}

var noWalletMinistries = {
	'Bestuurlijke vernieuwing en Koninkrijksrelaties': 'Binnenlandse Zaken en Koninkrijksrelaties',
	'Buitenlandse Handel en Ontwikkelingssamenwerking': 'Buitenlandse Zaken',
	'Immigratie en Asiel': 'Binnenlandse Zaken en Koninkrijksrelaties',
	'Immigratie, Integratie en Asiel': 'Binnenlandse Zaken en Koninkrijksrelaties',
	'Jeugd en Gezin': 'Volksgezondheid, Welzijn en Sport',
	'Ontwikkelingssamenwerking': 'Buitenlandse Zaken',
	'Wonen en Rijksdienst': 'Binnenlandse Zaken en KoninkrijksRelaties',
	'Wonen, Wijken en Integratie': 'Volkshuisvesting, Ruimtelijke Ordening en Milieubeheer',
	'Vreemdelingenzaken en Integratie': 'Binnenlandse Zaken en Koninkrijksrelaties'
};

/* parses strings like
     Minister voor Ontwikkelingssamenwerking
*/
function getMinisterPosition( context, data ) {
	var split, name, otherMinistry;

	if( data.toLowerCase().indexOf( 'minister ') === 0 ) {
		data = data.replace( /minister /i, '' );

		split = data.split( ' ' );

		while( skipWords.indexOf( split[ 0 ] ) > -1 ) split.shift();
		
		name = split.join( ' ' );

		otherMinistry = noWalletMinistries[ name ];
		name = 'Ministerie van ' + ( otherMinistry || name );

		return {
			relation: otherMinistry ? 'tnl:related' : 'tnl:boardmember',
			organization: name,
			organizationType: 'tnl:Public'
		};
	}
}

/* parses strings like
    Ministerie van Defensie (Nederland)
*/
function getMinistryPosition( context, data ) {
	var name, nameShort, position;

	if( data.toLowerCase().indexOf( 'ministerie') === 0 || data.toLowerCase().indexOf( 'staatssecretaris' ) === 0 ) {
		name = data.replace( parensRegex, '' ).trim();
		nameShort = name.split( ' ' ).slice( 2 ).join( ' ' ); // slice gets rid of 'ministerie' and 'van'/'voor' part

		doForOtherFields( context, getPosition );

		return {
			relation: position ? position : 'tnl:related',
			organization: name,
			organizationType: 'tnl:Public'
		};
	}

	function getPosition( key, value ) {
		if( position ) return;

		var fromAndBefore = getFromAndBefore( nameShort, value ),
				beforeSplit, afterSplit, word;

		if( !fromAndBefore ) return;

		beforeSplit = fromAndBefore.before.split( ' ' );

		while( skipWords.indexOf( word = beforeSplit.pop() ) > -1 );

		if( word === 'staatssecretaris' ) position = 'tnl:boardmember';
	}
}

/* parses strings like
		Lid van de Raad van State
		Staatsraad (Nederland)
*/
function getOtherMemberships( context, data ) {
	if( data.toLowerCase().indexOf( 'lid' ) === 0 ) {
		var split = data.split( ' ' ).slice( 1 );

		while( split.length && skipWords.indexOf( split[ 0 ].toLowerCase() ) > -1 ) {
			split.shift();
		}

		if( split[ 0 ].toLowerCase() === 'gemeenteraad' ) {
			split[ 0 ] = 'Gemeente';
			if( split[ 1 ] === 'van' ) split.splice( 1, 1 ); // remove word 'van'

			if( split[ 2 ] ) {// ooh weird. lets mark as invalid
				context.markNextAsInvalid = true;
			}
		} else context.markNextAsInvalid = true;
		
		return {
			relation: 'tnl:member',
			organization: split.join( ' ' ),
			organizationType: 'tnl:Public'
		};
	}

	if( data.toLowerCase().indexOf( 'staatsraad' ) === 0 ) {
		return {
			relation: 'tnl:member',
			organization: 'Raad van State',
			organizationType: 'tnl:Public'
		};
	}
}

function getFromAndBefore( needle, haystack ) {
	var index = haystack.toLowerCase().indexOf( needle.toLowerCase() );

	if( index === -1 ) return;

	return {
		before: haystack.substring( 0, index ).trim(),
		middle: haystack.substring( index, index + needle.length ),
		after: haystack.slice( index + needle.length ).trim()
	};
}

function toLowerCase( str ) { return str.toLowerCase(); }

function doForOtherFields( context, fun ) {
	Object.keys( context.dataByColumnName ).forEach( function( key ) {
		if( context.currentInput.indexOf( key ) > -1 ) return;
		fun( key, context.dataByColumnName[ key ] );
	} );
}
