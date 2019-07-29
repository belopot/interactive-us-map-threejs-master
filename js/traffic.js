// Traffic ----------------------------------------------------------------

function Traffic( x, y, z, size, color, label) {
	this.size = size;
	this.color = color;
	this.label = label;
	THREE.Vector3.call( this, x, y, z );
}

Traffic.prototype = Object.create( THREE.Vector3.prototype );

