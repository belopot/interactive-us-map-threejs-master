// Map Network --------------------------------------------------------

function MapNetwork() {

	this.initialized = false;

	this.settings = {
		verticesSkipStep: 2,
		maxLineDist: 3,
		maxConnectinosPerPoint: 6,
	};

	this.meshComponents = new THREE.Object3D();

	// NN component containers
	this.components = {
		mapPoints: [],
		mapLines: [],
		traffics: []
	};

	// map line
	this.mapLineOpacityMultiplier = 0.1;
	this.mapLineColor = '#14d5ff';
	this.mapLineGeom = new THREE.BufferGeometry();
	this.mapLinePositions = [];
	this.mapLineIndices = [];
	this.mapLineNextPositionsIndex = 0;

	this.mapLineUniforms = {
		color: {
			type: 'c',
			value: new THREE.Color(this.mapLineColor)
		},
		opacityMultiplier: {
			type: 'f',
			value: this.mapLineOpacityMultiplier
		}
	};

	this.mapLineAttributes = {
		opacity: {
			type: 'f',
			value: []
		}
	};

	// mappoint
	this.mapPointSizeMultiplier = 0.1;
	this.spriteTextureMapPoint = TEXTURES.circle;
	this.mapPointColor = '#ffffff';
	this.mapPointOpacity = 0.2;
	this.mapPointGeom = new THREE.Geometry();

	this.mapPointUniforms = {
		sizeMultiplier: {
			type: 'f',
			value: this.mapPointSizeMultiplier
		},
		opacity: {
			type: 'f',
			value: this.mapPointOpacity
		},
		texture: {
			type: 't',
			value: this.spriteTextureMapPoint
		}
	};

	this.mapPointAttributes = {
		color: {
			type: 'c',
			value: []
		},
		size: {
			type: 'f',
			value: []
		}
	};

	this.mapPointShaderMaterial = new THREE.ShaderMaterial({

		uniforms: this.mapPointUniforms,
		attributes: this.mapPointAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: currentBlendingMode,
		transparent: true,
		depthTest: false

	});


	// traffic
	this.trafficGeom = new THREE.Geometry();

	this.trafficUniforms = {
		sizeMultiplier: {
			type: 'f',
			value: 3
		},
		opacity: {
			type: 'f',
			value: 0.8
		},
		texture: {
			type: 't',
			value: TEXTURES.circle
		}
	};

	this.trafficAttributes = {
		color: {
			type: 'c',
			value: []
		},
		size: {
			type: 'f',
			value: []
		}
	};

	this.trafficShaderMaterial = new THREE.ShaderMaterial({

		uniforms: this.trafficUniforms,
		attributes: this.trafficAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: currentBlendingMode,
		transparent: true,
		depthTest: false

	});



	// initialize NN
	this.initNeuralNetwork();

}

MapNetwork.prototype.initNeuralNetwork = function () {

	this.initMapPoints(OBJ_MODELS.usmap.geometry.vertices);
	this.initMapLines();
	this.initTraffic();

	this.mapPointShaderMaterial.vertexShader = SHADER_CONTAINER.mappointVert;
	this.mapPointShaderMaterial.fragmentShader = SHADER_CONTAINER.mappointFrag;

	this.mapLineShaderMaterial.vertexShader = SHADER_CONTAINER.maplineVert;
	this.mapLineShaderMaterial.fragmentShader = SHADER_CONTAINER.maplineFrag;

	this.trafficShaderMaterial.vertexShader = SHADER_CONTAINER.mappointVert;
	this.trafficShaderMaterial.fragmentShader = SHADER_CONTAINER.mappointFrag;

	this.initialized = true;

};

MapNetwork.prototype.initMapPoints = function (inputVertices) {

	//Make mappoint from model data
	var staticMapPointId = 0;
	for (var i = 0; i < inputVertices.length; i += this.settings.verticesSkipStep) {
		var pos = inputVertices[i];
		var n = new MapPoint(staticMapPointId++, pos.x, pos.y, pos.z);
		this.components.mapPoints.push(n);
		this.mapPointGeom.vertices.push(n);
		// dont set mappoint's property here because its skip vertices
	}


	// set mappoint attributes value
	for (var i = 0; i < this.components.mapPoints.length; i++) {
		this.mapPointAttributes.color.value[i] = new THREE.Color('#ffffff'); // initial mappoint color
		this.mapPointAttributes.size.value[i] = THREE.Math.randFloat(0.75, 3.0); // initial mappoint size
	}


	// mappoint mesh
	this.mapPointParticles = new THREE.PointCloud(this.mapPointGeom, this.mapPointShaderMaterial);
	this.meshComponents.add(this.mapPointParticles);

	this.mapPointShaderMaterial.needsUpdate = true;

};

MapNetwork.prototype.initMapLines = function () {

	var allMapPointsLength = this.components.mapPoints.length;
	for (var j = 0; j < allMapPointsLength; j++) {
		var n1 = this.components.mapPoints[j];
		for (var k = j + 1; k < allMapPointsLength; k++) {
			var n2 = this.components.mapPoints[k];
			// connect mappoint if distance is within threshold and limit maximum connection per mappoint
			if (n1 !== n2 && n1.distanceTo(n2) < this.settings.maxLineDist &&
				n1.connection.length < this.settings.maxConnectinosPerPoint &&
				n2.connection.length < this.settings.maxConnectinosPerPoint) {
				var connectedMapLine = n1.connectPointTo(n2);
				this.constructMapLineArrayBuffer(connectedMapLine);
			}
		}
	}

	// enable WebGL 32 bit index buffer or get an error
	if (!renderer.getContext().getExtension("OES_element_index_uint")) {
		console.error("32bit index buffer not supported!");
	}


	var mapLineIndices = new Uint32Array(this.mapLineIndices);
	var mapLinePositions = new Float32Array(this.mapLinePositions);
	var mapLineOpacities = new Float32Array(this.mapLineAttributes.opacity.value);

	this.mapLineGeom.addAttribute('index', new THREE.BufferAttribute(mapLineIndices, 1));
	this.mapLineGeom.addAttribute('position', new THREE.BufferAttribute(mapLinePositions, 3));
	this.mapLineGeom.addAttribute('opacity', new THREE.BufferAttribute(mapLineOpacities, 1));
	this.mapLineGeom.computeBoundingSphere();

	this.mapLineShaderMaterial = new THREE.ShaderMaterial({
		uniforms: this.mapLineUniforms,
		attributes: this.mapLineAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: currentBlendingMode,
		depthTest: false,
		transparent: true
	});

	this.mapLineMesh = new THREE.Line(this.mapLineGeom, this.mapLineShaderMaterial, THREE.LinePieces);
	this.meshComponents.add(this.mapLineMesh);

};

MapNetwork.prototype.initTraffic = function () {

	this.trafficLabels = [];
	this.trafficLabelRoot = new THREE.Object3D();
	this.meshComponents.add(this.trafficLabelRoot);

	for (var i = 0; i < TrafficData.length; i++) {
		var posx = TrafficData[i].position.x - 131.5;
		var posy = TrafficData[i].height;
		var posz = TrafficData[i].position.y - 70;
		var n = new Traffic(posx, posy, posz, TrafficData[i].size, TrafficData[i].color, TrafficData[i].label);
		this.components.traffics.push(n);
		this.trafficGeom.vertices.push(n);

		//Comment
		var comp = new THREE.Object3D();
		comp.position.set(posx, posy, posz);
		this.trafficLabelRoot.add(comp);
		var label = new CommentLabel(TrafficData[i].label, comp);
		this.trafficLabels.push(label);
	}


	// set mappoint attributes value
	for (var i = 0; i < this.components.traffics.length; i++) {
		this.trafficAttributes.color.value[i] = new THREE.Color(TrafficData[i].color); // initial mappoint color
		this.trafficAttributes.size.value[i] = TrafficData[i].size; // initial mappoint size
	}


	// mappoint mesh
	this.trafficParticles = new THREE.PointCloud(this.trafficGeom, this.trafficShaderMaterial);
	this.meshComponents.add(this.trafficParticles);

	this.trafficShaderMaterial.needsUpdate = true;

};

MapNetwork.prototype.update = function (deltaTime) {

	if (!this.initialized) return;

	// update position of traffic labels
	for (var ii = 0; ii < this.trafficLabels.length; ii++) {
		this.trafficLabels[ii].updatePosition();
	}
};

MapNetwork.prototype.constructMapLineArrayBuffer = function (mapLine) {
	this.components.mapLines.push(mapLine);
	var vertices = mapLine.vertices;

	for (var i = 0; i < vertices.length; i++) {

		this.mapLinePositions.push(vertices[i].x, vertices[i].y, vertices[i].z);

		if (i < vertices.length - 1) {
			var idx = this.mapLineNextPositionsIndex;
			this.mapLineIndices.push(idx, idx + 1);

			var opacity = THREE.Math.randFloat(0.005, 0.2);
			this.mapLineAttributes.opacity.value.push(opacity, opacity);

		}

		this.mapLineNextPositionsIndex += 1;
	}
};

MapNetwork.prototype.releaseSignalAt = function () {

};
