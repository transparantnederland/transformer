//match to an existing organisation 
//only matches hardcoded two organisations for now
exports.transform = function (context, data) {
	if(!data) return new Error('getCompanyPlace: no data passed');
	
	var split = data.split(' te ');
	if(split.length > 1) return split[1];

	return new Error('getCompanyPlace: could not split on " te ", data: ' + JSON.stringify(data) );
};
