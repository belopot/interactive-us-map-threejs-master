// MapPoint ----------------------------------------------------------------

function MapPoint( idx, x, y, z ) {
	this.idx = idx;
	this.connection = [];
	this.fired = false;
	this.prevReleaseAxon = null;
	this.color = "#ffffff";
	THREE.Vector3.call( this, x, y, z );
}

MapPoint.prototype = Object.create( THREE.Vector3.prototype );

MapPoint.prototype.connectPointTo = function ( pointB ) {

	var pointA = this;
	// create mapline and establish connection
	var mapLine = new MapLine( pointA, pointB );
	pointA.connection.push( mapLine );
	pointB.connection.push( mapLine );
	return mapLine;

};

MapPoint.prototype.createSignal = function ( ) {

	var signals = [];
	
	return signals;

};

MapPoint.prototype.reset = function () {
	this.fired = false;
};
