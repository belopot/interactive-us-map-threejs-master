// Firework object
// constructor 
function Firework(parentObj, pos, size, color, duration, label) {
    this.parentObj = parentObj;
    this.dest = [];
    this.geometry = null;
    this.points = null;

    this.uniforms = {
        sizeMultiplier: {
            type: 'f',
            value: 1
        },
        opacity: {
            type: 'f',
            value: 1
        },
        texture: {
            type: 't',
            value: TEXTURES.circle
        }
    };

    this.attributes = {
        color: {
            type: 'c',
            value: []
        },
        size: {
            type: 'f',
            value: []
        }
    };

    this.material = new THREE.ShaderMaterial({

        uniforms: this.uniforms,
        attributes: this.attributes,
        vertexShader: SHADER_CONTAINER.fireworkVert,
        fragmentShader: SHADER_CONTAINER.fireworkFrag,
        blending: currentBlendingMode,
        transparent: true,
        depthTest: false

    });


    this.uniformsChild = {
        sizeMultiplier: {
            type: 'f',
            value: 1
        },
        opacity: {
            type: 'f',
            value: 1
        },
        texture: {
            type: 't',
            value: TEXTURES.circle
        }
    };

    this.attributesChild = {
        color: {
            type: 'c',
            value: []
        },
        size: {
            type: 'f',
            value: []
        }
    };

    this.materialChild = new THREE.ShaderMaterial({

        uniforms: this.uniformsChild,
        attributes: this.attributesChild,
        vertexShader: SHADER_CONTAINER.fireworkVert,
        fragmentShader: SHADER_CONTAINER.fireworkFrag,
        blending: currentBlendingMode,
        transparent: true,
        depthTest: false

    });


    this.duration = duration;
    this.timer = 0;
    this.position = pos;
    this.fireHeight = 13;
    this.fireCount = 30;
    this.fireRadius = 5;
    this.size = size;
    this.color = new THREE.Color(color);;
    this.launch();

    this.angle = [];
    this.speed = [];
    this.gravity = -0.05;
};
Firework.prototype.reset = function () {
    this.parentObj.remove(this.points);
    this.dest = [];
    this.geometry = null;
    this.points = null;
    this.material.opacity = 1;
    this.material.colorsNeedUpdate = true;
}
Firework.prototype.launch = function () {
    var from = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
    var to = new THREE.Vector3(this.position.x, this.position.y + this.fireHeight, this.position.z);

    // set mappoint attributes value
    this.attributes.color.value = [];
    this.attributes.size.value = [];
    this.attributes.color.value[0] = this.color;
    this.attributes.size.value[0] = this.size;
    this.materialChild.uniforms.opacity.value = 1;

    this.geometry = new THREE.Geometry();
    this.points = new THREE.PointCloud(this.geometry, this.material);

    this.geometry.vertices.push(from);
    this.dest.push(to);
    this.parentObj.add(this.points);
}
Firework.prototype.explode = function (vector) {
    this.parentObj.remove(this.points);
    this.dest = [];

    this.geometry = new THREE.Geometry();

    for (var i = 0; i < this.fireCount; i++) {


        var from = new THREE.Vector3(
            vector.x,
            vector.y,
            vector.z
        );
        var to = new THREE.Vector3(
            THREE.Math.randFloat(vector.x - this.fireRadius, vector.x + this.fireRadius),
            THREE.Math.randFloat(vector.y - this.fireRadius, vector.y + this.fireRadius),
            THREE.Math.randFloat(vector.z - this.fireRadius, vector.z + this.fireRadius)
        );
        this.geometry.vertices.push(from);
        this.dest.push(to);

        var ang = { x: THREE.Math.randFloat(0, 360), y: THREE.Math.randFloat(0, 360), z: THREE.Math.randFloat(0, 360) }
        this.angle.push(ang);

        var sd = THREE.Math.randFloat(0.01, 0.1);
        this.speed.push(sd);
    }

    for (var i = 0; i < this.geometry.vertices.length; i++) {
        this.attributesChild.color.value[i] = this.color;
        this.attributesChild.size.value[i] = this.size;
    }

    this.points = new THREE.PointCloud(this.geometry, this.materialChild);
    this.parentObj.add(this.points);
}
Firework.prototype.update = function (deltaTime) {
    this.timer += deltaTime;
    if (this.timer > this.duration) {
        this.reset();
        this.launch();
        this.timer = 0;
    }
    // only if objects exist
    if (this.points && this.geometry) {
        var total = this.geometry.vertices.length;


        // watch first particle for explosion 
        if (total === 1) {
            // lerp particle positions 
            for (var i = 0; i < total; i++) {
                this.geometry.vertices[i].y += (this.dest[i].y - this.geometry.vertices[i].y) / 60;

                this.geometry.verticesNeedUpdate = true;
            }

            if (Math.ceil(this.geometry.vertices[0].y) > this.dest[0].y - 5) {
                this.explode(this.geometry.vertices[0]);
                return;
            }
        }
        // fade out exploded particles 
        if (total > 1) {
            // lerp particle positions 
            for (var i = 0; i < total; i++) {
                this.geometry.vertices[i].x += Math.cos(this.angle[i].x) * this.speed[i];
                this.geometry.vertices[i].y += Math.sin(this.angle[i].y) * this.speed[i] + this.gravity;
                this.geometry.vertices[i].z += Math.cos(this.angle[i].z) * this.speed[i];

                this.geometry.verticesNeedUpdate = true;
            }

            this.materialChild.uniforms.opacity.value -= 0.015;
        }
    }
}