var c;
var gl;
var m = new matIV();
var q = new qtnIV();
var textures = [];
var cubeTexture = null;
var qt = q.identity(q.create());

onload = function () {
	this.setTimeout(renderWebGL, 300);
};

function renderWebGL() {
	var range = document.getElementById('range');
	c = document.getElementById('canvas');
	c.width = 512;
	c.height = 512;

	gl = c.getContext('webgl', { stencil: true }) || c.getContext('experimental-webgl', { stencil: true });
	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');

	var sphereData = sphere(64, 64, 2.5, [1, 1, 1, 1]);
	var spIndex = create_ibo(sphereData.i);
	var torusData = torus(64, 64, 1.0, 2.0, [1.0, 1.0, 1.0, 1.0]);
	var trIndex = create_ibo(torusData.i);
	var cubeData = cube(2, [1, 1, 1, 1]);
	var cIndex = create_ibo(cubeData.i);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix] = initialMatrix(7);
	var lightPosition = [-10, 10, 10];
	var camPosition = [0, 0, 20];
	var camUpDirection = [0, 1, 0];
	var hScale = 0.01;
	var count = 0;

	create_texture('texture.png', 0);
	create_texture('height.png', 1);
	create_cube_texture(['cube_PX.png', 'cube_PY.png', 'cube_PZ.png', 'cube_NX.png', 'cube_NY.png', 'cube_NZ.png'],
		[gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
		gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]);

	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	// gl.enable(gl.CULL_FACE);
	// gl.enable(gl.STENCIL_TEST);
	// gl.enable(gl.BLEND);
	// gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

	function render(scale, rad, axis, translate, textures, indexSize, linkValues, linkNames, linkTypes, prg) {
		bind_texture(textures);
		m.identity(mMatrix);
		m.translate(mMatrix, translate, mMatrix);
		m.rotate(mMatrix, rad, axis, mMatrix);
		m.scale(mMatrix, scale, mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		m.transpose(invMatrix, invTMatrix);
		linkUniform(linkValues, linkNames, linkTypes, prg);
		gl.drawElements(gl.TRIANGLES, indexSize, gl.UNSIGNED_SHORT, 0);
	}

	function setVPMatrix(camPosition, center, camUpDirection, fovy, width, height, near, far, isOrtho = false) {
		m.lookAt(camPosition, center, camUpDirection, vMatrix);
		if (isOrtho) {
			m.ortho(-1.0, 1.0, 1.0, -1.0, 0.1, 100, pMatrix);
		} else {
			m.perspective(fovy, width / height, near, far, pMatrix);
		}
		m.multiply(pMatrix, vMatrix, tmpMatrix);
	}

	(function () {
		count++;
		clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0, 0);
		var rad = (count % 360) * Math.PI / 180;

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);

		linkAttribute([cubeData.p, cubeData.c, cubeData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cIndex);
		setVPMatrix(camPosition, [0, 0, 0], camUpDirection, 45, c.width, c.height, 0.1, 500);
		render([100, 100, 100], 0, [0, 0, 0], [0, 0, 0], [], cubeData.i.length,
			[mMatrix, mvpMatrix, invTMatrix, 1, camPosition, false, range.value / 100],
			['mMatrix', 'mvpMatrix', 'invTMatrix', 'cubeTexture', 'eyePosition', 'refraction', 'eta'],
			['m4', 'm4', 'm4', 'i1', 'v3', 'i1', 'f1'], prg);

		linkAttribute([sphereData.p, sphereData.c, sphereData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndex);
		setVPMatrix(camPosition, [0, 0, 0], camUpDirection, 45, c.width, c.height, 0.1, 500);
		render([1, 1, 1], rad, [0, -1, 0], [5, 3, 0], [], sphereData.i.length,
			[mMatrix, mvpMatrix, invTMatrix, 1, camPosition, true, range.value / 100],
			['mMatrix', 'mvpMatrix', 'invTMatrix', 'cubeTexture', 'eyePosition', 'refraction', 'eta'],
			['m4', 'm4', 'm4', 'i1', 'v3', 'i1', 'f1'], prg);

		linkAttribute([torusData.p, torusData.c, torusData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, trIndex);
		setVPMatrix(camPosition, [0, 0, 0], camUpDirection, 45, c.width, c.height, 0.1, 500);
		render([1, 1, 1], rad, [1, -1, 1], [-4, 0, 0], [], torusData.i.length,
			[mMatrix, mvpMatrix, invTMatrix, 1, camPosition, true, range.value / 100],
			['mMatrix', 'mvpMatrix', 'invTMatrix', 'cubeTexture', 'eyePosition', 'refraction', 'eta'],
			['m4', 'm4', 'm4', 'i1', 'v3', 'i1', 'f1'], prg);

		gl.flush();
		setTimeout(arguments.callee, 1000 / 30);
	})();
}
