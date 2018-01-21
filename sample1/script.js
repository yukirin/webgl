var gl;
var m = new matIV();

onload = function(){
	var c = document.getElementById('canvas');
	c.width = 500;
	c.height = 300;
	
    gl = c.getContext('webgl') || c.getContext('experimental-webgl');
	
	var v_shader = create_shader('vertex.glsl', 'x-vertex');
    var f_shader = create_shader('fragment.glsl', 'x-fragment');
  
	var prg = create_program(v_shader, f_shader);
    
    var attLocation = new Array(2);
    attLocation[0] = gl.getAttribLocation(prg, 'position');
    attLocation[1] = gl.getAttribLocation(prg, 'color');
    var attStride = [3, 4];

	var vertex_position = [
        0.0, 1.0, 0.0,
        1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0
    ];

    var vertex_color = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];

    var vbo = [create_vbo(vertex_position), create_vbo(vertex_color)];
    linkAttribute(vbo, attLocation, attStride);
    var uniLocation = gl.getUniformLocation(prg, 'mvpMatrix');
    
    var mMatrix = m.identity(m.create());
    var vMatrix = m.identity(m.create());
    var pMatrix = m.identity(m.create());
    var tmpMatrix = m.identity(m.create());
    var mvpMatrix = m.identity(m.create());
    
    m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
    m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
    m.multiply(pMatrix, vMatrix, tmpMatrix);

	var count = 0;
	
	(function(){
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		count++;
        
		var rad = (count % 360) * Math.PI / 180;
		
		var x = Math.cos(rad);
		var y = Math.sin(rad);
		m.identity(mMatrix);
		m.translate(mMatrix, [x, y + 1.0, 0.0], mMatrix);
		
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
        
		m.identity(mMatrix);
		m.translate(mMatrix, [1.0, -1.0, 0.0], mMatrix);
		m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
		
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		
		var s = Math.sin(rad) + 1.0;
		m.identity(mMatrix);
		m.translate(mMatrix, [-1.0, -1.0, 0.0], mMatrix);
		m.scale(mMatrix, [s, s, 0.0], mMatrix)
		
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		
		gl.flush();
		
		setTimeout(arguments.callee, 1000 / 30);
    })();
}