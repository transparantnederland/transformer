var dutchMonthsLong = [
			'januari',
			'februari',
			'maart',
			'april',
			'mei',
			'juni',
			'juli',
			'augustus',
			'september',
			'oktober',
			'november',
			'december'
		],
		dutchMonthsShort = [
			'jan',
			'feb',
			'mrt',
			'apr',
			'mei',
			'jun',
			'jul',
			'aug',
			'sep',
			'okt',
			'nov',
			'dec'
		],
		englishMonthsByDutchMonthsLong = {
			januari: 'januari',
			februari: 'februari',
			maart: 'march',
			april: 'april',
			mei: 'may',
			juni: 'june',
			juli: 'july',
			augustus: 'august',
			september: 'september',
			oktober: 'october',
			november: 'november',
			december: 'december'
		},
		englishMonthsByDutchMonthsShort = {
			jan: 'januari',
			feb: 'februari',
			mrt: 'march',
			apr: 'april',
			mei: 'may',
			jun: 'june',
			jul: 'july',
			aug: 'august',
			sep: 'september',
			okt: 'october',
			nov: 'november',
			dec: 'december'
		},
		monthCollections = [dutchMonthsLong, dutchMonthsShort],
		yearRegExp = /([0-9][0-9][0-9][0-9])/;

//match to an existing organisation 
//only matches hardcoded two organisations for now
exports.transform = function (context, data) {
	if( !data ) return new Error('getAllDatesDutch: no data passed');

	var words = data.split(' '),
			dates = [],
			monthIndexes = [],
			years = [];

	words.forEach( checkWordForDate );

	monthIndexes.forEach( getDateFromMonthIndex );
	
	dates.push.apply( dates, years.map( createDate ) );

	dates = dates.sort( function( a, b ){
		return a.getTime() - b.getTime();
	} );

	return dates;

	function checkWordForDate( word, index ){
		var monthIndex = -1,
				yearResult;

		monthCollections.forEach( getMonthIndex );

		if(monthIndex > -1) {
			monthIndexes.push( monthIndex );
			return;
		}

		yearResult = yearRegExp.exec( word );
		if(yearResult) {
			years.push( yearResult[1] );
		}

		function getMonthIndex( months ) {
			monthIndex = monthIndex === -1 ?
				( months.indexOf( word ) > -1 ? index : -1 ) :
				monthIndex;
		}
	}

	function getDateFromMonthIndex( index ) {
		var monthStr = words[index],
				possibleYear = parseInt(words[index + 1], 10),
				possibleDay = parseInt(words[index - 1], 10),
				dateParts = [];

		if( !isNaN( possibleDay ) ){
			dateParts.push( possibleDay );
		}

		dateParts.push( englishMonthsByDutchMonthsShort[monthStr] || englishMonthsByDutchMonthsLong[monthStr] );

		if( !isNaN( possibleYear ) ){
			dateParts.push( possibleYear );
			years.splice( years.indexOf( possibleYear ), 1 );
		}

		dates.push( new Date( dateParts.join(' ') ) );
	}
};

function createDate( str ){
	return new Date( str );
}
