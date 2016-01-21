var datasetKeys = [
			'id',
			'title',
			'description',
			'author',
			'editor',
			'website',
			'edits',
			'creationDate',
			'license'
		];

var datasetsById = [],
		possibleMatch,
		datasets;

customMessageHandlers[ 'relationize:available-datasets' ] = onAvailableDatasets;
customMessageHandlers[ 'relationize:dataset-received' ] = datasetReceived;
customMessageHandlers[ 'relationize:possible-match' ] = requestMatchConfirmation;

function onAvailableDatasets( data ) {
	datasets = data;
	makeDatasetInfoForm();
}

function makeDatasetInfoForm() {
	var element = document.createElement( 'div' ),
			table = document.createElement( 'table' ),
			datalist = document.createElement( 'datalist' ),
			submit = document.createElement( 'button' );

	element.id = 'dataset-info';

	datalist.id = 'dataset-ids';

	datasets.forEach( createDatalistOption );

	datasetKeys.forEach( createFormRowForKey );

	element.appendChild( table );

	element.appendChild( datalist );

	submit.innerText = 'submit';
	submit.addEventListener( 'click', sendDatasetInfo );
	element.appendChild( submit );

	return document.querySelector( 'section#pending-revisions' ).appendChild( element );

	function createDatalistOption( dataset ) {
		datasetsById[ dataset.id ] = dataset;

		var option = document.createElement( 'option' );
		option.value = dataset.id;
		datalist.appendChild( option );
	}

	function createFormRowForKey( key ) {
		var tr = document.createElement( 'tr' ),
				labelTd = document.createElement( 'td' ),
				inputTd = document.createElement( 'td' ),
				label = document.createElement( 'label' ),
				input = document.createElement( 'input' );

		input.id = 'dataset-key-' + key;
		input.dataset.key = key;
		label.innerText = key;
		label.htmlFor = 'dataset-key-' + key;

		labelTd.appendChild( label );
		inputTd.appendChild( input );
		tr.appendChild( labelTd );
		tr.appendChild( inputTd );
		table.appendChild( tr );

		if( key === 'id' ) {
			input.setAttribute( 'list', 'dataset-ids' );
			input.addEventListener( 'blur', fillFieldsIfExistingDataset );
			input.addEventListener( 'keyup', fillFieldsIfExistingDataset );
		}
	}
}

function fillFieldsIfExistingDataset( event ) {
	var dataset = datasetsById[ this.value ];
	if( dataset ) {
		datasetKeys.forEach( fillInput );

		if( event.keyCode === 13 ) {
			sendDatasetInfo();
		}
	}

	function fillInput( key ) {
		if( key === 'id' ) return;

		document.getElementById( 'dataset-key-' + key ).value = dataset[ key ];
	}
}

function sendDatasetInfo() {
	var values = {};
	
	Array.prototype.forEach.call( document.querySelectorAll( '#dataset-info input' ), getValue );

	sendCustomMessage( 'relationize:dataset-info', values );

	return;

	function getValue( element ) {
		values[ element.dataset.key ] = element.value;
	}
}

function datasetReceived() {
	console.log( 'datasetReceived' );
	var datasetForm = document.getElementById( 'dataset-info' );
	if( datasetForm ) datasetForm.remove();
	sendCustomMessage( 'relationize:request-possible-match');
}

function requestMatchConfirmation( data ) {
	possibleMatch = data.possibleMatch;

	var element = document.createElement( 'div' ),
			textSpan = document.createElement( 'span' ),
			lineBreak = document.createElement( 'br' ),
			matchButton = document.createElement( 'button' ),
			noMatchButton = document.createElement( 'button' ),
			skipAllButton = document.createElement( 'button' );

	matchButton.innerHTML = 'match';
	noMatchButton.innerHTML = 'no match';
	skipAllButton.innerHTML = 'skip ' + data.matchesLeft + ' remaining';
	
	matchButton.className = 'relations-matches';
	noMatchButton.className = 'relations-matches-not';
	skipAllButton.className = 'relations-skip-matching';

	textSpan.innerHTML = possibleMatch.pit.name + ' matches ' + possibleMatch.possibleMatch.name + '?';
	textSpan.className = 'relations-text';

	element.appendChild( textSpan );
	element.appendChild( lineBreak );
	element.appendChild( matchButton );
	element.appendChild( noMatchButton );
	if( data.matchesLeft ) element.appendChild( skipAllButton );

	document.querySelector( 'section#pending-revisions' ).appendChild( element );

	matchButton.addEventListener( 'click', sendMatch );
	noMatchButton.addEventListener( 'click', sendNotMatch );
	skipAllButton.addEventListener( 'click', sendSkipAll );
	
	function sendMatch(){
		sendCustomMessage( 'relationize:match-confirmed', possibleMatch );
		element.remove();
	}

	function sendNotMatch(){
		sendCustomMessage( 'relationize:match-denied', possibleMatch );
		element.remove();
	}

	function sendSkipAll(){
		sendCustomMessage( 'relationize:skip-matches' );
		element.remove();
	}
}
