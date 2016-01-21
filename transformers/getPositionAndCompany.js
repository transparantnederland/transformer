var stringlistRegexp = require('stringlist-regexp'),
		stores = require('dumbstore');

var jobTitleStore = stores.getStore('StringStore', 'jobtitle'),
		organizationNamesStore = stores.getStore( 'StringStore', 'organizationnames' ),
		jobtitles = jobTitleStore.items,
		jobtitleFind = new RegExp( stringlistRegexp( jobtitles, true, false ) ),
		splitWords = [
			'van',
			'bij',
			'op'
		],
		anySplitWord = new RegExp( stringlistRegexp( splitWords, false, false ) ),
		organizationNames = organizationNamesStore.items,
		organizationNameFind = new RegExp( stringlistRegexp( organizationNames, false, false ) );

jobTitleStore.subscribe( function(jobTitles) {
	jobtitles = jobTitles;

	jobtitleFind = new RegExp( stringlistRegexp( jobtitles, true, false ) );
});

organizationNamesStore.subscribe( function( organizationNamesReceived ) {
	organizationNames = organizationNamesReceived;

	organizationNameFind = new RegExp( stringlistRegexp( organizationNames, false, false ) );
} );

//match to an existing organisation 
//only matches hardcoded two organisations for now
exports.transform = function (context, data) {
	var string = data,
			containsKnownJobTitle = jobtitleFind.exec( string ),
			containsKnownOrganization = organizationNameFind.exec( string ),
			jobTitle, company, rest;


	if( containsKnownJobTitle && containsKnownJobTitle[1] ){
		jobTitle = containsKnownJobTitle[1];
		rest = string.substring(jobTitle.length).trim().split(',')[0];

		containsSplitword = anySplitWord.exec(rest);

		return {
			jobTitle: jobTitle,
			company: rest
		};
	}

	if( containsKnownOrganization ){
		return {
			company: containsKnownOrganization[1]
		};
	}

	return new Error('getPositionAndCompany: could not get position and company from data, data: ' + JSON.stringify( data ) );
};

