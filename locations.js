var request = require( 'request' ),
		cheerio = require( 'cheerio' );

var url = 'https://nl.wikipedia.org/wiki/Lijst_van_Nederlandse_gemeenten_per_provincie',
		provinces = [],
		municipalities = [];

request(url, extractProvincesAndMunicipalitiesFromWikipedia );

module.exports = {
	provinces: provinces,
	municipalities: municipalities,
	ready: false,
	readySubscribers: []
};

function extractProvincesAndMunicipalitiesFromWikipedia( error, response, body ) {
	var $ = cheerio.load( body ),
			provs = Array.prototype.map.call( $( 'h2 span.mw-headline a' ), returnTextContent ),
			municis = Array.prototype.map.call( $( 'ol li a' ), returnTextContent );
	
	function returnTextContent( anchor, index ){
		var textContent;
		
		anchor.children.forEach( function( node ) {
			textContent = node.data;
		} );

		return textContent;
	}
	
	Array.prototype.push.apply( provinces, provs );
	Array.prototype.push.apply( municipalities, municis );

	module.exports.ready = true;
	
	while( module.exports.readySubscribers.length ) module.exports.readySubscribers.shift()();
}
