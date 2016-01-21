var enrichCSV = require( 'enrich-csv' );

// enrichCSV( {
// 	lookupCSV: './data/biografie_bestand_wetsawa_20160111.csv',
// 	filesToTransform: [ './data/biografie_bestand_wetsawa_20160111-details.csv' ],
// 	outputSuffix: '-modified',
// 	lookupField: 'b1-nummer',
// 	//lookupFieldDest: 'b1-nummer',
// 	extraData: {
// 		//naam: 'achternaam'//,
// 		naam: function( record ){
// 			//console.log( record );
// 			return ( record.roepnaam + ' ' + record.prepositie + ' ' + record.achternaam ).replace( '  ', ' ' );
// 		}
// 	}
// }, console.log.bind( console, 'done' ) );


enrichCSV( {
	lookupCSV: './data/pdc.csv',
	filesToTransform: [ './data/pdc-details.csv' ],
	outputSuffix: '-modified',
	lookupField: 'b1-nummer',
	//lookupFieldDest: 'b1-nummer',
	extraData: {
		//naam: 'achternaam'//,
		naam: function( record ){
			return ( record.roepnaam + ' ' + record.prepositie + ' ' + record.achternaam ).replace( '  ', ' ' );
		},
		'id bp': 'begin periode',
		'id ep': 'einde periode'
	}
}, console.log.bind( console, 'done' ) );
