var async = require('async'),
    _ = require('underscore'),
    request = require('request'),
    leven = require('leven'),
    shortId = require('shortid'),
    util = require( 'util' ),
    apiUrl = process.env.TNL_APIURL || 'https://api.transparantnederland.nl/';

var relationTypes = [
      'tnl:same', 'tnl:parent', 'tnl:related', 'tnl:member', 'tnl:boardmember', 'tnl:commissioner', 'tnl:advisor', 'tnl:employee', 'tnl:lobbyist'
    ],
    personTypes = [ 'tnl:Person' ],
    relationWhitelist = ['id', 'type', 'from', 'to', 'data'],
    pitWhitelist = ['id', 'type', 'name', 'data'];

// // for now have in memory cache only
// var cache = {};

function postProcessor(data, bucket, cb){
  var pitsById = {},
      pitsByName = {},
      relationsByFrom = {},
      pits = [],
      relations = [],
      directMatches = 0,
      possibleMatches = [],
      outstandingMatches = [],
      readyForMatch = [],
      finished, allPossibleMatchesHandled,
      datasets, dataset, datasetId,
      datasetInfoGotten;

  data.forEach( putInBucket );

  relations.forEach( updateRelationReferencesToPrimaryEntity );

  pits = pits.filter( deduplicatePitPredicate );

  relations = relations.filter( deduplicateRelationPredicate );

  bucket.onCustomMessageIn( 'relationize:dataset-info', onDatasetInfo );
  bucket.onCustomMessageIn( 'relationize:request-possible-match', onRequestPossibleMatch );
  bucket.onCustomMessageIn( 'relationize:match-confirmed', onMatchConfirmed );
  bucket.onCustomMessageIn( 'relationize:match-denied', onMatchDenied );
  bucket.onCustomMessageIn( 'relationize:skip-matches', onSkipMatches );

  bucket.loadScript( '/relations.js' );

  request( apiUrl + 'datasets', gotDatasets );

  return;

  function gotDatasets( err, response, body ) {
    datasets = JSON.parse( body );
    bucket.customMessageOut( { type: 'relationize:available-datasets', data: datasets } );
  }

  function putInBucket( entity ){
    var isRelation = ( relationTypes.indexOf( entity.type ) > -1 ),
        isPerson = personTypes.indexOf( entity.type ) > -1,
        bucket = isRelation ? relations : pits,
        put = true;

    pitsById[ entity.id || entity.uri ] = entity;
    
    if( !isRelation ) {

      if( isPerson ) {

        // make a same relation
        if( pitsByName[ entity.name ] ) {
          relations.push( {
            from: entity.id || entity.uri,
            to: pitsByName[ entity.name ].id || pitsByName[ entity.name ].uri,
            type: 'tnl:same'
          } );

        } else pitsByName[ entity.name ] = entity;

      } else {

        if(!pitsByName[ entity.name ] ) {
          pitsByName[ entity.name ] = entity;
        } else {
          put = false;
        }

      }
    }

    if( put ) bucket.push( entity );
  }

  // solves problem of relations referencing entities removed because they were doubles
  function updateRelationReferencesToPrimaryEntity( relation ) {
    var fromPossibleDouble = pitsById[ relation.from ],
        toPossibleDouble = pitsById[ relation.to ],
        fromPDIsPerson = personTypes.indexOf( fromPossibleDouble.type ) === -1,
        toPDIsPerson = personTypes.indexOf( toPossibleDouble.type ) === -1,
        fromName = fromPossibleDouble.name,
        toName = toPossibleDouble.name,
        fromEntity = pitsByName[ fromName ],
        toEntity = pitsByName[ toName ];

    // people are not dedoubled, otherwise set the ids to the first one declared
    if( fromPDIsPerson ) relation.from = fromEntity.id || fromEntity.uri;
    if( toPDIsPerson ) relation.to = toEntity.id || fromEntity.uri;

    var relationsByTo = relationsByFrom[ relation.from ] = relationsByFrom[ relation.from ] || {};
    relationsByTo[ relation.to ] = relationsByTo[ relation.to ] || relation;
  }

  function deduplicatePitPredicate( pit ) {
    // we're not deduping people so always return true if it's a person
    if( personTypes.indexOf( pit.type ) > -1 ) return true;

    return pit === pitsByName[ pit.name ];
  }

  function deduplicateRelationPredicate( relation ) {
    return relation === relationsByFrom[ relation.from ][ relation.to ];
  }

  function pitDatasetIsNotCurrentDatasetPredicate( pit ) {
    return pit.dataset !== datasetId;
  }

  function findExistingCopyAndMakeSameAsRelation( pit, cb ) {
    var searchName = pit.name.replace(/"/g, '').toLowerCase().trim();
    if(finished) return setImmediate( cb );
    
    return request.get( apiUrl + '/search?name=' + searchName, gotPit );

    function gotPit( err, response, body ) {
      if(finished) return setImmediate( cb );

      var concepts, newRelation;
      try{
        concepts = JSON.parse(body);
      } catch( err ){
        console.log(err, body, response);
        return cb( err );
      }

      if( !concepts || !concepts.length ) return cb();

      concepts = _.compact( concepts.map( filterAndSortPitsInConcept ) );

      concepts.sort( sortConceptOnDistance );

      if( !concepts.length || !concepts[ 0 ][ 0 ].pit.name ) return cb();

      var bestMatchingPit = concepts[ 0 ][ 0 ].pit,
          bestMatch = bestMatchingPit.name.toLowerCase(),
          bestMatchIdentifier = bestMatchingPit.id || bestMatchingPit.uri;
      
      if( bestMatch === searchName ) {
        newRelation = {
          from: pit.id || pit.uri,
          to: bestMatchIdentifier,
          type: 'tnl:same'
        };
        relations.push(newRelation);
        directMatches++;
      } else {
        if( pit.type === 'tnl:Person' && bestMatchingPit.type === 'tnl:Person' ){
          var formattedMatch = bestMatch.split(', ').reverse().join(' ').replace(' - ', '-'),
              lastName = searchName.split(', ').reverse().join(' ').split(' ').pop(),

              firstNameInitial = searchName[0],
              matchedInitials = false,
              matchedLastName = false;

          formattedMatch.split(' ').forEach( matchPart );

          if( matchedInitials && matchedLastName ){
            relations.push({
              from: pit.id || pit.uri,
              to: bestMatchIdentifier,
              type: 'tnl:same'
            });
            directMatches++;
          }

          else if( matchedLastName ){
            possibleMatches.push( {
              pit: pit,
              possibleMatch: bestMatchingPit,
              distanceFromSearchName: concepts[ 0 ][ 0 ].distanceFromSearchName
            } );

            if( readyForMatch.length ){
              sendPossibleMatch( readyForMatch.shift() );
            }
          }

          function matchPart ( part ) {
            if( /\./.exec( part ) ){
              matchedInitials = matchedInitials || firstNameInitial === part[0];
            } else {
              matchedLastName = matchedLastName || lastName === part;
            }
          }
        }
      }

      return cb();

      function filterAndSortPitsInConcept( concept ){
        concept = concept.filter( isValidPitPredicate );
        
        concept.forEach( calculateDistance );

        concept.sort( sortPitOnDistance );

        return concept.length ? concept : null;

        function isValidPitPredicate( pitContainer ) {
          var pit = pitContainer.pit;
          return hasName( pit ) && pitDatasetIsNotCurrentDatasetPredicate( pit );
        }
      }
    }

    function calculateDistance( conceptPit ) {
      conceptPit.distanceFromSearchName = leven( searchName, conceptPit.pit.name );
    }
  }

  function onDatasetInfo( datasetInfo, reply ) {
    if( datasetInfoGotten ) return;
    datasetInfoGotten = true;

    dataset = datasetInfo;
    datasetId = datasetInfo.id;

    async.eachLimit( pits, 5, findExistingCopyAndMakeSameAsRelation, queriedAllPits );
    bucket.customMessageOut( { type: 'relationize:dataset-received' } );
  }

  function onRequestPossibleMatch( message, reply ){
    if( possibleMatches.length ) sendPossibleMatch( reply );
    else readyForMatch.push( reply );
  }

  function onMatchConfirmed( message, reply ){
    relations.push( {
      from: message.pit.id || message.pit.uri,
      to: message.possibleMatch.id || message.possibleMatch.uri,
      type: 'tnl:same'
    } );
    removePossibleMatch( message.pit );
    onRequestPossibleMatch( message, reply );
  }

  function onMatchDenied( message, reply ){
    removePossibleMatch( message.pit );
    onRequestPossibleMatch( message, reply );
  }

  function removePossibleMatch( pit ){
    possibleMatches = possibleMatches.filter( function( match ) {
      return ( match.pit.id || match.pit.uri ) !== ( pit.id || pit.uri );
    } );

    if(!possibleMatches.length && finished){
      allPossibleMatchesHandled();
    }
  }

  function sendPossibleMatch( send ){
    var possibleMatch = possibleMatches.shift();
    outstandingMatches.push( possibleMatch );
    send( {
      type: 'relationize:possible-match',
      data: {
        possibleMatch: possibleMatch,
        matchesLeft: possibleMatches.length
      }
    } );
  }

  function onSkipMatches(){
    possibleMatches = [];
    if( finished ) allPossibleMatchesHandled();
    finished = true;
  }

  function queriedAllPits( err ){
    finished = true;

    if( !possibleMatches.length ) {
      return done();
    }

    possibleMatches.sort( sortPitOnDistance );

    allPossibleMatchesHandled = done;

    bucket.customMessageOut( { type: 'relationize:possible-matches-left', data: possibleMatches.length } );
  }

  function done(err){
    if( err ) return cb( err );

    return cb(null, {
      write: [{
        fileSuffix: '.pits.ndjson',
        contents: pits.map( JSON.stringify ).join( '\n' )
      }, {
        fileSuffix: '.relations.ndjson',
        contents: relations.map( JSON.stringify ).join( '\n' )
      }, {
        fileSuffix: '.json',
        contents: JSON.stringify( dataset, null, 2)
      }]
    } );
  }
}

function hasName( conceptPit ) {
  return !!conceptPit.name;
}

function sortPitOnDistance( a, b ) {
  return a.distanceFromSearchName - b.distanceFromSearchName;
}

function sortConceptOnDistance( a, b ) {
  return a[ 0 ].distanceFromSearchName - b[ 0 ].distanceFromSearchName;
}

module.exports = postProcessor;
