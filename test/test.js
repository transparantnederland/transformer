var assert = require('assert'),
    expect = require('expect'),
    parseFunctionWrapper = require('../transformers/parseFunction'),
    locations = require('../locations.js'),
    parseFunction = parseFunctionWrapper.transform,
    testData = [ {
      name: 'getStatenGeneraal',
      dataByColumnName: { functie: 'Tweede Kamer' },
      expectedOutput: {
        organization: 'Tweede Kamer',
        organizationType: 'tnl:Public',
        relation: 'tnl:member' } }, {
      name: 'getOrphanedPosition',
      dataByColumnName: {
        partij: 'Anti-Revolutionaire Partij',
        functie: 'Secretaris' },
      expectedOutput: {
        relation: 'tnl:boardmember',
        organization: 'Anti-Revolutionaire Partij',
        organizationType: 'tnl:PoliticalParty' } }, {
      name: 'getMunicipalPosition',
      dataByColumnName: { functie: 'Wethouder van Zoetermeer' },
      expectedOutput: {
        relation: 'tnl:boardmember',
        organization: 'Gemeente Zoetermeer',
        organizationType: 'tnl:Public' } }, {
      name: 'getKnownPartyFromVerbose ',
      dataByColumnName: { functie: 'Lijst Pim Fortuyn' },
      expectedOutput: {
        relation: 'tnl:member',
        organization: 'LPF',
        organizationType: 'tnl:PoliticalParty' } }, {
      name: 'getEuroParliamentMembership',
      dataByColumnName: { functie: 'Lid Europees Parlement' },
      expectedOutput: {
        relation: 'tnl:member',
        organization: 'Europees Parlement',
        organizationType: 'tnl:Organization' } }, {
      name: 'getLocationRelation',
      dataByColumnName: { functie: 'Utrecht (provincie)' },
      expectedOutput: {
        relation: 'tnl:related',
        organization: 'Provincie Utrecht',
        organizationType: 'tnl:Public' } }, {
      name: 'getPositionAtParty',
      dataByColumnName: { functie: 'Lid partijbestuur SP' },
      expectedOutput: {
        relation: 'tnl:boardmember',
        organization: 'SP',
        organizationType: 'tnl:PoliticalParty' } }, {
      name: 'getSpecificPosition',
      dataByColumnName: { functie: 'Minister-president' },
      expectedOutput: {
        relation: 'tnl:boardmember',
        organization: 'Ministerie van Algemene Zaken',
        organizationType: 'tnl:Public' } }, {
      name: 'getOtherMemberships',
      dataByColumnName: { functie: 'Lid van de Raad van State' },
      expectedOutput: {
        relation: 'tnl:member',
        organization: 'Raad van State',
        organizationType: 'tnl:Public' } }, {
      name: 'getMinisterPosition',
      dataByColumnName: { functie: 'Minister voor Ontwikkelingssamenwerking' },
      expectedOutput: {
        relation: 'tnl:related',
        organization: 'Ministerie van Buitenlandse Zaken',
        organizationType: 'tnl:Public' } }, {
      name: 'getProvincialPosition',
      dataByColumnName: { functie: 'commissaris van de Koningin in Limburg' },
      expectedOutput: {
        relation: 'tnl:boardmember',
        organization: 'Provincie Limburg',
        organizationType: 'tnl:Public' } }, {
      name: 'getMinistryPosition',
      dataByColumnName: { functie: 'Ministerie van Defensie (Nederland)' },
      expectedOutput: {
        relation: 'tnl:related',
        organization: 'Ministerie van Defensie',
        organizationType: 'tnl:Public' } }, {
      name: 'getLoneStateFunction',
      dataByColumnName: {
        functie: 'Staatssecretaris (Nederland)',
        abstract: 'Arend (Aar) de Goede (Vlaardingen, 21 mei 1928) is een Nederlands voormalig politicus voor D66.De Goede was financieel-economisch woordvoerder van de eerste D66-fractie in de Tweede Kamer. Voordat hij de politiek inging, werkte hij bij de Belastingdienst en op de secretariaten van onder meer een vormingscentrum en een adviesbureau. Hij was door zijn werkzaamheden bij het Reactor Centrum Nederland deskundig op het gebied van de kernenergie. Als staatssecretaris van Financiën bracht hij in het kabinet-Den Uyl een vernieuwing van de Comptabiliteitswet tot stand die de positie van de Algemene Rekenkamer versterkte. Hij werd later Europarlementariër en was één jaar Eerste Kamerlid.Aar de Goede behoort tot de Nederlandse Hervormde Kerk (tegenwoordig Protestantse Kerk in Nederland - PKN).' },
      expectedOutput: {
        relation: 'tnl:related',
        organization: 'Staatssecretaris',
        organizationType: 'tnl:Public' } }, {
      name: 'getOtherMemberships',
      dataByColumnName: { functie: 'Staatsraad (Nederland)' },
      expectedOutput: {
        relation: 'tnl:member',
        organization: 'Raad van State',
        organizationType: 'tnl:Public' } }, {
      name: 'getLocationRelation',
      dataByColumnName: { functie: 'Anna Paulowna (plaats)' },
      expectedOutput: {
        relation: 'tnl:related',
        organization: 'Anna Paulowna (plaats)',
        organizationType: 'tnl:Public' } }
    ];

parseFunctionWrapper.test = true;

describe('testing transformers', function() {
  describe('parseFunction', function () {

    it( 'should wait for locations to be loaded', function( done ) {
      locations.readySubscribers.push( done );
    });

    testData.forEach( function( testItem ) {
      it(testItem.name, function() {
        var context = {
              dataByColumnName: testItem.dataByColumnName,
              currentInput: [ 'functie' ]
            },
            output = parseFunction( context, testItem.dataByColumnName.functie );

        if( !Object.keys( output ).length ) {
          console.log( 'write output for this one: ', testItem.dataByColumnName );
        }

        expect( output ).toExist();
        expect( typeof output ).toBe( 'object' );
        expect( Object.keys( output ).length ).toBe( 3 );

        if( !Object.keys( testItem.expectedOutput ).length ) console.log( output );

        expect( Object.keys( testItem.expectedOutput ).length ).toBe( 3 );
        
        Object.keys( testItem.expectedOutput ).forEach( function( key ) {
          var value = testItem.expectedOutput[ key ];
          expect( output[ key ] ).toEqual( value );
        } );
      } );
    } );

  });
});
