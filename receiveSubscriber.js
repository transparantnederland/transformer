var _ = require('underscore'),
		async = require('async'),
		stores = require('dumbstore'),
		jobTitleStore = stores.getStore('StringStore', 'jobtitle'),
		entityHandlers = {
			'tnl:member': function( entity, cb ){
				if( entity.data && entity.data.jobtitle && entity.data.jobtitle.length ){
					jobTitleStore.add( entity.data.jobtitle );
				}

				setImmediate( cb );
			}
		};

function receiveSubscriber( editType, receivedData, originalData, cb ){
	var entities = receivedData.entities;

	if( !entities ) return setImmediate( _.partial( cb, receivedData ) );

	return async.each( Object.keys( entities ), extractCacheables, _.partial( cb, receivedData ) );

	function extractCacheables( key, cb ){
		var entity = entities[key];

		if(entityHandlers[entity.type]) return entityHandlers[entity.type]( entity, cb );
		
		setImmediate( cb );
	}
}

module.exports = receiveSubscriber;
