var fixedOrganizationNames = {
			'1e kamerlid': 'Eerste Kamer',
			'2e kamerlid': 'Tweede Kamer',
			'belast met coördinatie van aangelegenheden de Nederlandse Antillen en Aruba betreffend en met de zorg voor aan de Nederlandse Antillen en Aruba te verlenen hulp en bijstand': 'Commissie voor Nederlands-Antilliaanse en Arubaanse Zaken',
			'belast met co�rdinatie van aangelegenheden de Nederlandse Antillen en Aruba betreffend en met de zorg voor aan de Nederlandse Antillen en Aruba te verlenen hulp en bijstand': 'Commissie voor Nederlands-Antilliaanse en Arubaanse Zaken',
			'voorzitter Eerste Kamer der Staten-Generaal': "Eerste Kamer",
			'voorzitter Tweede Kamer der Staten-Generaal': "Tweede Kamer",
		},
		walletMinistries = [
			'Algemene Zaken',
			'Binnenlandse Zaken',
			'Binnenlandse Zaken en Koninkrijksrelaties',
			'Buitenlandse Zaken',
			'Defensie',
			'Economische Zaken',
			'Economische Zaken, Landbouw en Innovatie',
			'Financiën',
			'Infrastructuur en Milieu',
			'Justitie',
			'Landbouw, Natuurbeheer en Visserij',
			'Landbouw, Natuur en Voedselkwaliteit',
			'Onderwijs, Cultuur en Wetenschap',
			'Sociale Zaken en Werkgelegenheid',
			'Veiligheid en Justitie',
			'Verkeer en Waterstaat',
			'Volksgezondheid, Welzijn en Sport',
			'Volkshuisvesting, Ruimtelijke Ordening en Milieubeheer',
		],
		noWalletMinistries = {
			'Bestuurlijke vernieuwing en Koninkrijksrelaties': 'Binnenlandse Zaken en Koninkrijksrelaties',
			'Buitenlandse Handel en Ontwikkelingssamenwerking': 'Buitenlandse Zaken',
			'Financi�n': 'Financiën',
			'Grotesteden- en Integratiebeleid': 'Binnenlandse Zaken',
			'Immigratie en Asiel': 'Binnenlandse Zaken en Koninkrijksrelaties',
			'Immigratie, Integratie en Asiel': 'Binnenlandse Zaken en Koninkrijksrelaties',
			'Integratie, Preventie, Jeugdbescherming en Reclassering': 'Justitie',
			'Jeugd en Gezin': 'Volksgezondheid, Welzijn en Sport',
			'Onderwijs, Cultuur en Wetenschap(pen)': 'Onderwijs, Cultuur en Wetenschap',
			'Ontwikkelingssamenwerking': 'Buitenlandse Zaken',
			'Wonen en Rijksdienst': 'Binnenlandse Zaken en KoninkrijksRelaties',
			'Wonen, Wijken en Integratie': 'Volkshuisvesting, Ruimtelijke Ordening en Milieubeheer',
			'Vreemdelingenzaken en Integratie': 'Binnenlandse Zaken en Koninkrijksrelaties'
		};

module.exports.transform = function( context, data ) {
	var fixedOrganizationName = fixedOrganizationNames[ data ],
			postName,
			string;

	if( fixedOrganizationName ) return fixedOrganizationName;

	if( data === 'minister' || data === 'staatssecretaris' ) {
		string = 'Ministerie van ';

		postName = context.dataByColumnName[ 'post(en) in kabinet(ten)' ];

		postName = postName.replace( 'minister voor ', '' ).replace( 'minister van ', '' );

		if( postName === 'Minister-President' ) postName = 'Algemene Zaken';

		if( fixedOrganizationNames[ postName ] ) return fixedOrganizationNames[ postName ];
		console.log( postName );
		
		if( walletMinistries.indexOf( postName ) > -1 ) {
			return string + postName;
		}

		if( noWalletMinistries[ postName ] ) return string + noWalletMinistries[ postName ];

		if( postName === 'Viceminister-president' ) return string + 'Algemene Zaken';
	}

	console.log( data );
	console.log( context.dataByColumnName );
	process.exit();
};
