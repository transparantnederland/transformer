var _ = require('underscore'),
		async = require('async'),
		stores = require('dumbstore'),
		jobTitleStore = stores.getStore('StringStore', 'jobtitle'),
		organizationNamesStore = stores.getStore( 'StringStore', 'organizationnames' ),
		entityHandlers = {
			'tnl.relation': function( entity, schema, mapping, cb ){
				if( entity.data && entity.data.jobtitle && entity.data.jobtitle.length ) {
					jobTitleStore.add( entity.data.jobtitle );
				}

				setImmediate( cb );
			},
			'tnl.organization': function( entity, schema, mapping, cb ) {
				if( entity.name ){
					organizationNamesStore.add( entity.name );
				}

				setImmediate( cb );
			}
		};

module.exports = entityHandlers;
