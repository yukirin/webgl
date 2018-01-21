var gl;
var m = new matIV();
var texture = null;

onload = function(){
	var c = document.getElementById('canvas');
	c.width = 500;
	c.height = 300;
	
	var elmTransparency = document.getElementById('transparency');
	var elmAdd = document.getElementById('add');
	var elmRange = document.getElementById('range');

    gl = c.getContext('webgl') || c.getContext('experimental-webgl');
	
	var v_shader = create_shader('vertex.glsl', 'x-vertex');
    var f_shader = create_shader('fragment.glsl', 'x-fragment');
  
	var prg = create_program(v_shader, f_shader);
    
    var attLocation = new Array();
    attLocation[0] = gl.getAttribLocation(prg, 'position');
    attLocation[1] = gl.getAttribLocation(prg, 'color');
    attLocation[2] = gl.getAttribLocation(prg, 'textureCoord');
    var attStride = [3, 4, 2];

	var position = [
		-1.0, 1.0, 0.0,
		1.0, 1.0, 0.0,
		-1.0, -1.0, 0.0,
		1.0, -1.0, 0.0
	];
	
	var color = [
		1.0, 0.0, 0.0, 1.0,
		0.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0
	];

	var textureCoord = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, 1.0,
		1.0, 1.0
	];

	var index = [
		0, 1, 2,
		3, 2, 1
	];

	var vPosition = create_vbo(position);
	var vColor = create_vbo(color);
	var vTextureCoord = create_vbo(textureCoord);
	var VBOList = [vPosition, vColor, vTextureCoord];
	var iIndex = create_ibo(index);

	linkAttribute(VBOList, attLocation, attStride);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iIndex);

	var uniLocation = new Array();
	uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
	uniLocation[1] = gl.getUniformLocation(prg, 'vertexAlpha');
	uniLocation[2] = gl.getUniformLocation(prg, 'texture');
	uniLocation[3] = gl.getUniformLocation(prg, 'useTexture');
	
    var mMatrix = m.identity(m.create());
    var vMatrix = m.identity(m.create());
    var pMatrix = m.identity(m.create());
    var tmpMatrix = m.identity(m.create());
	var mvpMatrix = m.identity(m.create());
    
    m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
    m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
	m.multiply(pMatrix, vMatrix, tmpMatrix);

	var count = 0;
	
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);

	create_texture('texture.png', 0);
	gl.activeTexture(gl.TEXTURE0);

	(function(){
		if (elmTransparency.checked) {
			blend_type(0);
		}

		if (elmAdd.checked) {
			blend_type(1);
		}

		var vertexAlpha = parseFloat(elmRange.value / 100);

        gl.clearColor(0.0, 0.75, 0.75, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		count++;
		var rad = (count % 360) * Math.PI / 180;

		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);

		m.identity(mMatrix);
		m.translate(mMatrix, [0.25, 0.25, -0.25], mMatrix);
		m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);

		gl.disable(gl.BLEND);

		gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
		gl.uniform1f(uniLocation[1], 1.0);
		gl.uniform1i(uniLocation[2], 0);
		gl.uniform1i(uniLocation[3], true);
		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

		m.identity(mMatrix);
		m.translate(mMatrix, [-0.25, -0.25, 0.25], mMatrix);
		m.rotate(mMatrix, rad, [0, 0, 1], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.enable(gl.BLEND);

		gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
		gl.uniform1f(uniLocation[1], vertexAlpha);
		gl.uniform1i(uniLocation[2], 0);
		gl.uniform1i(uniLocation[3], false);
		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

		gl.flush();
		
		setTimeout(arguments.callee, 1000 / 30);
    })();
}