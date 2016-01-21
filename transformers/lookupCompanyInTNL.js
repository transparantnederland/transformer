var request = require('request'),
		async = require('async');

var apiUrl = process.env.TNL_APIURL || 'https://api.transparantnederland.nl/';

module.exports.transform = function(context, data, cb){
	console.log({
		context: context
	});
	console.log({
		data: data
	});
	request(apiUrl + 'search?q=' + data, handleResponse);

	function handleResponse(err, response){
		console.log('err?', err);
		if(err) return cb();
		console.log(data);
		console.log( JSON.parse( response.body ) );
	}
};
