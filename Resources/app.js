var win = Ti.UI.createWindow({
	title : 'Deutsche Nationalbibliothek',
	backgroundImage : '/assets/images/default.png'
});
var abx = require('com.alcoapps.actionbarextras');
var searchView = Ti.UI.Android.createSearchView({
	hintText : "Suche …",
	top : 0
});
var query='';
var nextRecord = 0;
const onLoad = function(e) {
	const response = e.searchRetrieveResponse;
	nextRecord= response.nextRecordPosition;
	Ti.UI.createNotification({
		message : (response.nextRecordPosition-1)+ '/'+ response.numberOfRecords + ' Treffer',
		duration : 3000
	}).show();
	if (!response.records.record || !response.records.record.list) {
		console.log(">>>>>>>>>>>");
		listView.clear();
		return;
	}
	const items = response.records.record.list.map(function(record) {
		const data = record.recordData.dc;
		var creator = "";
		if (data['dc:creator'] && typeof data['dc:creator'] == "string")
			creator = data['dc:creator'];
		else if (data['dc:creator'] && Array.isArray(data['dc:creator'].list))
			creator = data['dc:creator'].list.join(', ');
		const item = {
			title : {
				text : data['dc:title']
			},
			publisher : {
				text : data['dc:publisher'] ? (data['dc:publisher']) + ',  ' + data['dc:date'] : data['dc:date']
			},
			creator : {
				text : creator
			},
			properties : {
				itemId : JSON.stringify(data),
				accessoryType : Ti.UI.LIST_ACCESSORY_TYPE_DISCLOSURE
			}
		};
		return item;
	});
	listView.addSection(items);
	listView.backgroundColor = 'white';
};

searchView.addEventListener('submit', function() {
	menuItem.collapseActionView();
	query= searchView.getValue();
	abx.setSubtitle('Suche nach „' + query + '“');
	DNB.searchretrieve({
		query : query,
		maximumRecords : 100
	}, onLoad);
});

win.add(searchView);

var listView = require('listview')();

win.add(listView);

listView.addEventListener('itemclick', function(e) {
	console.log(e.itemId);
});

listView.addEventListener('scrollend', function(e) {
	const ndx = e.visibleItemCount + e.firstVisibleItemIndex;
	const section= e.firstVisibleSectionIndex;
	console.log("ndx="+ndx + '  '+ section);
	if (ndx>1 && ndx%100 == 0)
		DNB.searchretrieve({
			query : query,
			maximumRecords : 100,
			startRecord : nextRecord
		}, onLoad);
});

win.open();

const DNB = require('de.appwerft.sru').createEndpoint({
	url : "https://services.dnb.de/sru",
	version : '1.1',
	catalog : 'dnb',
	recordSchema : 'oai_dc',
	accesstoken : require('.accesstoken'),
	explained : function(e) {
	}
});

abx.setStatusbarColor('#D6CC50');
abx.setBackgroundColor('#2E7CBD');
abx.subtitle = "Suche im Gesamtbestand";

var menuItem;
win.activity.onCreateOptionsMenu = function(e) {
	abx.setStatusbarColor('#D6CC50');
	abx.setBackgroundColor('#2E7CBD');
	abx.subtitle = "Suche im Gesamtbestand";
	var menu = e.menu;
	menuItem = menu.add({
		title : 'Suche',
		actionView : searchView,
		icon : '/assets/images/lupe.png',
		showAsAction : Ti.Android.SHOW_AS_ACTION_IF_ROOM | Ti.Android.SHOW_AS_ACTION_COLLAPSE_ACTION_VIEW
	});
};
