// Traffic ----------------------------------------------------------------

function Traffic(root, x, y, z, size, color, label) {
	this.size = size;
	this.color = color;
	var geometry = new THREE.CircleGeometry(this.size, 18);
	var material = new THREE.MeshBasicMaterial({ color: this.color, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
	this.component = new THREE.Mesh(geometry, material);
	this.component.position.set(x, y, z);
	this.component.rotation.set(-Math.PI / 2, 0, 0);
	root.add(this.component);

	this.label = new CommentLabel(label, this.component);
}


