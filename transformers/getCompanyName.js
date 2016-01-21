var stringlistRegexp = require('stringlist-regexp'),
		stores = require('dumbstore');

var organizationNamesStore = stores.getStore( 'StringStore', 'organizationnames' ),
		organizationNames = organizationNamesStore.items,
		organizationNameFind = new RegExp( stringlistRegexp( organizationNames, false, false ) );

organizationNamesStore.subscribe( function( organizationNamesReceived ) {
	organizationNames = organizationNamesReceived;
	organizationNameFind = new RegExp( stringlistRegexp( organizationNames, false, false ) );
} );

//match to an existing organisation 
//only matches hardcoded two organisations for now
exports.transform = function (context, data) {
	var string = data,
			containsKnownOrganization = organizationNameFind.exec( string ),
			company, rest;

	if( containsKnownOrganization ){
		return {
			company: containsKnownOrganization[1]
		};
	}
	return new Error('getCompany: could not find company from data, data: ' + JSON.stringify( data ) );
};

