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
	c = document.getElementById('canvas');
	c.width = 512;
	c.height = 512;

	gl = c.getContext('webgl', { stencil: true }) || c.getContext('experimental-webgl', { stencil: true });
	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');
	create_texture('toon.png', 0);

	var sphereData = sphere(64, 64, 1.5);
	var spIndex = create_ibo(sphereData.i);
	var torusData = torus(64, 64, 0.5, 2.5);
	var trIndex = create_ibo(torusData.i);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix] = initialMatrix(7);
	var lightDirection = [-0.5, 0.5, 0.5];
	var camPosition = [0, 0, 10];
	var camUpDirection = [0, 1, 0];
	var count = 0;

	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	gl.enable(gl.CULL_FACE);
	// gl.enable(gl.STENCIL_TEST);
	// gl.enable(gl.BLEND);
	// gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

	function render(scale, rad, axis, translate, textures, indexSize, ibo, linkValues, linkNames, linkTypes, prg) {
		bind_texture(textures);
		m.identity(mMatrix);
		m.translate(mMatrix, translate, mMatrix);
		m.rotate(mMatrix, rad, axis, mMatrix);
		m.scale(mMatrix, scale, mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		m.transpose(invMatrix, invTMatrix);
		linkUniform(linkValues, linkNames, linkTypes, prg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
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
		var rad = (count % 360) * Math.PI / 180;

		clearBuffer([0.0, 0.7, 0.7, 1.0], 1.0, 0);
		setVPMatrix(camPosition, [0, 0, 0], camUpDirection, 45, c.width, c.height, 0.1, 200);

		gl.cullFace(gl.BACK);
		linkAttribute([sphereData.p, sphereData.c, sphereData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
		render([1, 1, 1], 0, [1, 1, 1], [0, 0, 0], [textures[0]], sphereData.i.length, spIndex,
			[mMatrix, mvpMatrix, invTMatrix, lightDirection, 0, false, [0, 0, 0, 0]],
			['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'texture', 'edge', 'edgeColor'],
			['m4', 'm4', 'm4', 'v3', 'i1', 'i1', 'v4'], prg);

		gl.cullFace(gl.FRONT);
		linkAttribute([sphereData.p, sphereData.c, sphereData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
		render([1, 1, 1], 0, [1, 1, 1], [0, 0, 0], [textures[0]], sphereData.i.length, spIndex,
			[mMatrix, mvpMatrix, invTMatrix, lightDirection, 0, true, [0, 0, 0, 1]],
			['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'texture', 'edge', 'edgeColor'],
			['m4', 'm4', 'm4', 'v3', 'i1', 'i1', 'v4'], prg);

		gl.cullFace(gl.BACK);
		linkAttribute([torusData.p, torusData.c, torusData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
		render([1, 1, 1], rad, [1, 1, 1], [0, 0, 0], [textures[0]], torusData.i.length, trIndex,
			[mMatrix, mvpMatrix, invTMatrix, lightDirection, 0, false, [0, 0, 0, 0]],
			['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'texture', 'edge', 'edgeColor'],
			['m4', 'm4', 'm4', 'v3', 'i1', 'i1', 'v4'], prg);

		gl.cullFace(gl.FRONT);
		linkAttribute([torusData.p, torusData.c, torusData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
		render([1, 1, 1], rad, [1, 1, 1], [0, 0, 0], [textures[0]], torusData.i.length, trIndex,
			[mMatrix, mvpMatrix, invTMatrix, lightDirection, 0, true, [0, 0, 0, 1]],
			['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'texture', 'edge', 'edgeColor'],
			['m4', 'm4', 'm4', 'v3', 'i1', 'i1', 'v4'], prg);

		gl.flush();
		setTimeout(arguments.callee, 1000 / 30);
	})();
}
