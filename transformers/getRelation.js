var stringlistRegexp = require('stringlist-regexp'),
		stores = require('dumbstore');
  
var relationNamesStore = stores.getStore( 'StringStore', 'relations' ),
		relationNames = relationNamesStore.items,
		relationNameFind = new RegExp( stringlistRegexp( relationNames, false, false ) );
    console.log( stringlistRegexp( relationNames, false, false ), 'hoi' );

var bestuurRE = new RegExp( /(Burgemeester|Bestuurs|Commissaris van de Koningin|Dijkgraaf|voorzitter|Gedeputeerde|Minister|Staatssecretaris|Wethouder|directeur).*/i )
var ledenRE   = new RegExp( /\s*lid\s+/i )

relationNamesStore.subscribe( function( relationNamesReceived ) {
	relationNames = relationNamesReceived;
	relationNameFind = new RegExp( stringlistRegexp( relationNames, false, false ) );
} );

exports.transform = function (context, data) {
	var string = data,
			containsKnownRelation = relationNameFind.exec( string ),
			relation, rest;
  // console.log(containsKnownRelation)

  if(bestuurRE.exec(string)) {
    return 'tnl:boardmember';
  } else if (ledenRE.exec(string)) {
    return 'tnl:member';
  }

	return new Error('getRelation: could not find relation from data, data: ' + JSON.stringify( data ) );
};

