var particle_count = 0;
function Particle(pos, vel, m, radius, isFixed, material, path_duration, path_color){
	this.pos = pos;
	this.vel = vel;
	this.m = m;
	this.radius = radius;
	this.isFixed= isFixed;
	this.material = material;
	this.path_duration= path_duration;
	this.path_color = path_color;
	this.i=particle_count;
	particle_count++;
}

var edge_count = 0;
function Edge(particle_i, particle_j, radius, color){
	this.particle_i = particle_i;
	this.particle_j = particle_j;
	this.radius = radius;
	this.color = color;
	this.i = edge_count;
	edge_count++;
}

// var default_material = new THREE.MeshNormalMaterial(  );
var default_material = new THREE.MeshNormalMaterial( { shading: THREE.SmoothShading } );
// var default_material = new THREE.MeshBasicMaterial( { color: 0xffaa00, wireframe: true } );
// var default_material = new THREE.MeshBasicMaterial( { color: 0xffaa00, transparent: true, blending: THREE.AdditiveBlending } );
// var default_material = new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0x666666, emissive: 0xff0000, ambient: 0x000000, shininess: 10, shading: THREE.SmoothShading, opacity: 0.9, transparent: true } );
// var default_material = new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0x666666, emissive: 0x00ff00, ambient: 0x000000, shininess: 10, shading: THREE.SmoothShading, opacity: 0.9, transparent: true } );

// var default_material = new THREE.MeshLambertMaterial( { color: 0xdddddd, shading: THREE.FlatShading } );
// var default_material = new THREE.MeshPhongMaterial( { ambient: 0x030303, color: 0xdddddd, specular: 0x009900, shininess: 30, shading: THREE.FlatShading } );
// var default_material = new THREE.MeshLambertMaterial( { color: 0xdddddd, shading: THREE.SmoothShading } );
// var default_material = new THREE.MeshDepthMaterial();
// var default_material = new THREE.MeshLambertMaterial( { color: 0x666666, emissive: 0xff0000, ambient: 0x000000, shading: THREE.SmoothShading } );

function new_particle(pos, vel, m, radius, isFixed, material, path_duration, path_color){
	var particle_material = material;
	if (material==undefined) particle_material = default_material;
	var particle = new Particle(pos, vel, m, radius, isFixed, particle_material, path_duration, path_color);
	particles.push(particle);
	return particle.i;
}

function scene1(){

	particles.push(new Particle([0,0.6,0],[1,0,0],1,1,false));
	particles.push(new Particle([0,-0.6,0],[0,0,0],1,1,false));
	
	edges.push(new Edge(0,1,0.1, new THREE.Color( 1, 0, 10)));

	var spring_force = new SpringForce([0,1], 1, 10, 0.);
	forces.push(spring_force);

	var transp_material = new THREE.MeshBasicMaterial( { color: 0x555555, transparent: true, blending: THREE.AdditiveBlending } );
	var shininess = 0, specular = 0x333333, bumpScale = 1, shading = THREE.SmoothShading;

	var default_material = new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0x666666, emissive: 0xff0000, ambient: 0x000000, shininess: 10, shading: THREE.SmoothShading, opacity: 0.9, transparent: true } );
	particle_materials.push( default_material );
	particle_materials.push( default_material );
	
	var duration =2;
	paths.push(new ParticlePath( 0, Math.ceil(duration/dt), 0xffffff));
	// var simple_gravity_force = new SimpleGravityForce([0,-100,0]);
	// two_ds_scene.insertForce(simple_gravity_force);
}



function rgb_v(i, min_i, max_i, type){
	var rgb = []
	if (type == 1)
		rgb = [[1,0,0], [1,1,0], [0,1,0], [0,1,1], [0, 0,1],[1,0,1], [1,0,0]];
	else if (type == 2)
		rgb = [[0,0,0], [1,0,0], [1,1,0], [1,1,1], [1, 1,0],[1,0,0], [0,0,0]];
	else
		rgb = [[0,0,0], [1,0,0], [0,0,0], [0,1,0], [0, 0,0],[0,0,1], [0,0,0]];
	
	var n_rgb = [0,0,0]
	var n = max_i-min_i
	var pp = n/6.
	var i_ = Math.min(Math.floor((i-min_i)/pp),5)
	var j_ = (i-min_i) % Math.floor(pp)

	for(var c=0;c<3;c++){	
		var delta = rgb[i_+1][c] - rgb[i_][c]
		if (delta == 0)
			n_rgb[c] = rgb[i_][c]
		else if (delta > 0)
			n_rgb[c] = (1.0  * j_) / pp;
		else
			n_rgb[c] = 1.0 - ((1.0 * j_) / pp);
	}
	return new THREE.Color( n_rgb[0], n_rgb[1], n_rgb[2]);
}

function scene2(){
	var n = 15;
	
	var angle_b = 360./n;
	var	rad_b = angle_b*Math.PI/180.;
	var pp = Math.floor(n / 6.);
	var radius = 3;

	var p0 = new THREE.Vector3( radius, 0, 0 );
	var v0 = new THREE.Vector3( 0, 5, 0);

	center = new_particle([0,0,0],[0,0,0],1,1,true);

	var ci = 0
	var max_ci = n*n
	for (var i=0; i <n; i++){
		for (var j=0; j <n; j++){
			var rad_i =i*rad_b;
			var rad_j =j*rad_b;
			pi = p0.clone();
			vi = v0.clone();
			var a = new THREE.Euler( 0, rad_j, rad_i, 'XYZ' );
	    	pi.applyEuler(a);
	    	vi.applyEuler(a);
			var part_i = new_particle([pi.x,pi.y,pi.z],[vi.x,vi.y,vi.z],1,0.4,false);
			
			var spring_force = new SpringForce([0,part_i], 1, 3, 0.);
			forces.push(spring_force);
			edges.push(new Edge(0,part_i,0.4, rgb_v(ci,0,max_ci,1)));
			ci = (ci+1) % max_ci
		}
	}
}

function scene3(){
	scene2();

	camera.position.z = 50;
	dt=0.001;
	var G = 1.18419, M=331436;
	var center = new_particle([0,0,0],[0,0,0],M,0.5,true);
    n_planets=50;

	var ci = 0
	var max_ci = n_planets
	start_planets = particle_count;
	for(var i=1; i<n_planets+1; i++){
	  var dist = 5+i*0.5;
	  var ca1 = Math.random() * 360;
	  var ca2 = Math.random() * 360;
	  var ca3 = Math.random() * 360;
	  var p0 = new THREE.Vector3( dist, 0, 0 );
	  var sign = (i % 2 == 0) ? 1 : -1;
	  var v0 = new THREE.Vector3( 0,sign*Math.sqrt(G*M/dist),0 );
	  var a = new THREE.Euler( ca3, ca1, ca2, 'XYZ' );
	  v0.applyEuler(a);
	  p0.applyEuler(a);
	  var pos = [p0.x, p0.y, p0.z]
	  var vel = [v0.x, v0.y, v0.z]
	  var planet = new_particle(pos, vel, 1,1, false, new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0x666666, emissive: 0x00ff00, ambient: 0x000000, shininess: 10, shading: THREE.SmoothShading, opacity: 0.9, transparent: true } ));
	  var gravitational_force = new GravitationalForce(center,planet,G);
	  forces.push(gravitational_force);
	  var duration = dist/10;
	  paths.push(new ParticlePath( planet, Math.ceil(duration/dt), rgb_v(ci,0,max_ci,1)));
      ci = (ci+1) % max_ci
	}

}

function scene41(){
	
	camera.position.z = 300;
	dt=0.05
	var first_p = undefined; 
	var last_p = undefined;
    var ci = 0
	var max_ci = 360
	var scale = 1
	var mass = 1
	var r = 5;

	for(var i = 0; i < 360; i++){
		var radius = (1 + 4*Math.cos(5.*i*Math.PI/180.))*30

		var pos = [scale*radius*Math.cos(i*Math.PI/180.),  scale*radius*Math.sin(i*Math.PI/180.), radius/2]
		var part = new_particle(pos, [0,0,0], mass,r, false);

		
		if (first_p == undefined) first_p = part;
		if (last_p!=undefined){
			var spring_force = new SpringForce([part,last_p], 30, scale*0.01, 0.);
			forces.push(spring_force);
			edges.push(new Edge(part,last_p, scale*4, rgb_v(ci,0,max_ci,1)));
		    ci = (ci+1) % max_ci
		}
		last_p = part;
	}
	var spring_force = new SpringForce([first_p,last_p], 30, scale*0.01, 0.);
	forces.push(spring_force);
	edges.push(new Edge(first_p,last_p, scale*4, rgb_v(ci,0,max_ci,1)));
}


function scene4(scale, dx, dy, dz, center){
	// dt=0.05
	var first_p = undefined; 
	var last_p = undefined;
    var ci = 0
	var max_ci = 360
	// var scale = 10

	for(var i = 0; i < 360; i++){
		var radius = (1 + 4*Math.cos(5.*i*Math.PI/180.))*30


		// var mass = 3200;//1
		// var r = 100;//0.5

		var mass = 1
		var r = 1

		// var pos = [scale*radius*Math.cos(i*Math.PI/180.), 0, scale*radius*Math.sin(i*Math.PI/180.)]
		// var pos = [dx +scale*radius*Math.cos(i*Math.PI/180.), dy+scale*radius*Math.sin(i*Math.PI/180.),dz+ scale*radius/2]
		var pos = [dx +scale*radius*Math.cos(i*Math.PI/180.), dy, dz+scale*radius*Math.sin(i*Math.PI/180.)]
		var part = new_particle(pos, [0,0,0], mass,r, false);
		// var buoyancy = new BuoyancyForce(part,[0,-1,0],[0,0,0],1.6);
		// forces.push(buoyancy);
		
		var G = 1.18419;
		var gravitational_force = new GravitationalForce(center,part,G);
	  	forces.push(gravitational_force);
		var buoyancy_force = new RadialBuoyancyForce(part,center,500);
	    forces.push(buoyancy_force);

		if (first_p == undefined) first_p = part;
		if (last_p!=undefined){
			var spring_force = new SpringForce([part,last_p], 30, scale*0.01, 0.);
			forces.push(spring_force);
			edges.push(new Edge(part,last_p, scale*4, rgb_v(ci,0,max_ci,1)));
		    ci = (ci+1) % max_ci
		}
		last_p = part;
	}
	var spring_force = new SpringForce([first_p,last_p], 30, scale*0.01, 0.);
	forces.push(spring_force);
	edges.push(new Edge(first_p,last_p, scale*4, rgb_v(ci,0,max_ci,1)));
}




function scene5(){
	dt=0.5;
	camera.position.y = 500;
	camera.position.z = 500;

	//Lights
	var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.35 );
	directionalLight.position.set( 100, 300, 0 )
	scene.add( directionalLight );
	directionalLight.castShadow = true;
	var d = 1000;
	directionalLight.shadowCameraLeft = -d;
	directionalLight.shadowCameraRight = d;
	directionalLight.shadowCameraTop = d;
	directionalLight.shadowCameraBottom = -d;
	directionalLight.shadowCameraNear = 1;
	directionalLight.shadowCameraFar = 4000;
	directionalLight.shadowMapWidth = 1024;
	directionalLight.shadowMapHeight = 1024;
	directionalLight.shadowBias = -0.005;
	directionalLight.shadowDarkness = .7;

	var simple_gravity_force = new SimpleGravityForce([0,-10,0]);
	forces.push(simple_gravity_force);
	
	var n = 20;
	for(var i=-n/2;i<n/2;i++){
		for(var j=-n/2;j<n/2;j++){
		var height = 100+200*Math.sin((2*Math.PI*i)/n);
		var part = new_particle([i*300, 100+height, j*300], [0,0,0], 3200, 100, false, new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0x666666, emissive: 0x00ff00, ambient: 0x000000, shininess: 10, shading: THREE.SmoothShading, opacity: 0.9, transparent: true } ));
		var buoyancy_force = new BuoyancyForce(part,[0,-1,0],[0,0,0],1.6);
		forces.push(buoyancy_force);
		}
	}

	//water
	var worldWidth = 128, worldDepth = 128,
	worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
	var water_geometry = new THREE.PlaneGeometry( 10000, 10000, worldWidth - 1, worldDepth - 1 );
	water_geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
	water_geometry.computeFaceNormals();
	water_geometry.computeVertexNormals();
	var texture = THREE.ImageUtils.loadTexture( "https://dl.dropboxusercontent.com/u/25861113/planet_textures/water.jpg" );
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set( 5, 5 );
	material = new THREE.MeshBasicMaterial( { color: 0x0044ff, map: texture, opacity: 0.9, transparent: true} );
	water_mesh = new THREE.Mesh( water_geometry, material );
	water_mesh.position.y=0;
	scene.add( water_mesh );

	// Ground
	var plane = new THREE.Mesh(
	    new THREE.PlaneBufferGeometry( 10000, 10000 ),
	    new THREE.MeshPhongMaterial( { ambient: 0x999999, color: 0x999999, specular: 0x101010 } )
	  );
	plane.rotation.x = -Math.PI/2;
	plane.position.y = -400;
	scene.add( plane );
	plane.receiveShadow = true;


    var clock = new THREE.Clock();
	do_stuff=function(){
   	    var time = clock.getElapsedTime() * 10;

		for ( var i = 0, l = water_geometry.vertices.length; i < l; i ++ ) {
			water_geometry.vertices[ i ].y = 20 * Math.sin( i / 5 + ( time + i ) / 7 )
			+20 * Math.sin( ( time + i ) / 7 )
			;
		}
		water_mesh.geometry.verticesNeedUpdate = true;
	}
}


function scene6(){
	show_edges=false;
	var center_material = new THREE.MeshBasicMaterial( { color: 0xffaa00, transparent: true, blending: THREE.AdditiveBlending } );
	var core_material = new THREE.MeshLambertMaterial( { color: 0x666666, emissive: 0xff0000, ambient: 0x000000, shading: THREE.SmoothShading } );
	particle_materials.push(center_material);
	particle_materials.push(core_material);

	camera.position.z = 40;
	dt=0.005;
	var G = 1.18419, M=331436, R= 10, r=1;
	bottom_radius = R/2;
	var center = new_particle([0,0,0],[0,0,0],M,R,true);
	new_particle([0,0,0],[0,0,0],1,R/2,true);
	var n_planets=200;

	var ci = 0
	var max_ci = n_planets	

	// scene4(0.05,0,15,0,center);
	// scene4(0.05,0,-15,0,center);
	for(var i=1; i<n_planets+1; i++){
	  var dist = R+i*0.25;
	  var p0 = new THREE.Vector3( dist, 0, 0 );
	  var ca1 = Math.random() * 360;
	  var ca2 = Math.random() * 360;
	  var ca3 = Math.random() * 360;
	  // var pos = [dist * Math.sin(ca * Math.PI/180), 0, dist * Math.cos(ca * Math.PI/180)]
	  var a = new THREE.Euler( ca3, ca1, ca2, 'XYZ' );
	  p0.applyEuler(a);
	  var pos = [p0.x, p0.y, p0.z]
	  var sign = (i % 2 == 0) ? 1 : -1;
	  var vel = [0,0,0];
	  // var v0 = new THREE.Vector3( 0,sign*Math.sqrt(G*M/dist),0 );
	  // v0.applyEuler(a);
	  // var vel = [v0.x, v0.y, v0.z]
	  var m = 1;
	  var planet = new_particle(pos, vel, m,r, false, new THREE.MeshNormalMaterial( { shading: THREE.SmoothShading }  ));
	  var gravitational_force = new GravitationalForce(center,planet,G);
	  forces.push(gravitational_force);
	  // var duration = dist/10;
	  // paths.push(new ParticlePath( planet, Math.ceil(duration/dt), rgb_v(ci,0,max_ci,1)));
      // ci = (ci+1) % max_ci
	  var buoyancy_force = new RadialBuoyancyForce(planet,center,500);
	  forces.push(buoyancy_force);
	}

}

function scene7(){
	camera.position.z = 100;

	var G = 1.18419, M=331436, R= 10, r=1;
	// var paths = [];
	var center = new_particle([0,0,0],[0,0,0],M,R,true);
	var n_planets=100;

	var radius = 20, segments = 80, rings = 80;
	var default_material = new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0x666666, emissive: 0xff0000, ambient: 0x000000, shininess: 10, shading: THREE.SmoothShading, opacity: 0.9, transparent: true } );
    var water_geometry =new THREE.SphereGeometry(radius, segments,rings);
    var water_mesh = new THREE.Mesh(water_geometry,
		    default_material);

		  water_mesh.position.x=0;
		  water_mesh.position.y=0;
		  water_mesh.position.z=0;
		scene.add( water_mesh );
	    var clock = new THREE.Clock();
		do_stuff=function(){
	   	    var time = clock.getElapsedTime() * 10;

			for ( var i = 0, l = water_geometry.vertices.length; i < l; i ++ ) {
				water_geometry.vertices[ i ].y += 0.02 * Math.sin( i / 5 + ( time + i ) / 7 )
				;
			}
			water_mesh.geometry.verticesNeedUpdate = true;
		}

}