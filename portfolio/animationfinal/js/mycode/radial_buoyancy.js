var WIDTH, HEIGHT;
var VIEW_ANGLE, ASPECT, NEAR, FAR;
var scene, camera, renderer, dt, integrator;
var controls;
var three_d_scene;
var i,j,k;
var edges = [];
var particles = [];
var edge_colors = [];
var particle_materials = [];
var paths = [];
var forces = [];
var do_stuff = function(){};
var do_stuff_before_render = function(){};
var reference;
var show_particles, show_edges;
var mouse = new THREE.Vector2();
var INTERSECTED, INTERSECTED_aux;
var mouse_clicked = false, button_clicked = false, leftclick = true;
var raycaster= new THREE.Raycaster();
var original_radii=[];
var radii_scale=[];
var bottom_radius;
function onDocumentMouseMove( event ) {
  event.preventDefault();
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}
$("body").mousedown(function(ev){
  leftclick=true;
  if(ev.which == 3) leftclick=false;
  mouse_clicked = true;
});
document.addEventListener( 'mousemove', onDocumentMouseMove, false );
THREE.ImageUtils.crossOrigin = '';

// set the scene size
WIDTH = window.innerWidth,//400,
  HEIGHT = window.innerHeight;//300;

// set some camera attributes
VIEW_ANGLE = 75,
  ASPECT = WIDTH / HEIGHT,
  NEAR = 0.1,
  FAR = 100000;

scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR );
camera.position.z = 10;
controls = new THREE.TrackballControls( camera );
renderer = new THREE.WebGLRenderer();
// renderer = new THREE.WebGLRenderer( { preserveDrawingBuffer: true } );
// renderer.sortObjects = false;
// renderer.autoClearColor = false;
renderer.setClearColor( 0x0b0b0b, 1 );
renderer.setSize( WIDTH, HEIGHT );
integrator = new SymplecticEuler();
dt = 0.01;
reference = new THREE.Mesh();
scene.add(reference);
show_particles = true, show_edges = true;
document.body.appendChild( renderer.domElement );

scene6();


three_d_scene = new ThreeDScene(particle_count);

for(i=0;i<particle_count;i++){
  three_d_scene.setPosition(i, particles[i].pos);
  three_d_scene.setVelocity(i, particles[i].vel);
  three_d_scene.radii[i]= particles[i].radius;
  three_d_scene.setM(i, particles[i].m);
  three_d_scene.isFixed[i] = particles[i].isFixed;
  particle_materials.push( particles[i].material );
  radii_scale.push(1);
}

original_radii = three_d_scene.radii.slice(0);

for(i=0;i<edge_count;i++){
  three_d_scene.insertEdge([edges[i].particle_i,edges[i].particle_j], edges[i].radius);
  edge_colors.push(edges[i].color);
}

three_d_scene.forces=forces;

// Create an ambient light
var light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

// set up the sphere vars
var radius = 0.8, segments = 16, rings = 16;
var particle_meshes = new Array(0);
for (i = 0; i < three_d_scene.num_particles; i++) {
  var pos = three_d_scene.getPosition(i);
  radius = three_d_scene.radii[i];

  var sphere = new THREE.Mesh(
    new THREE.SphereGeometry(
      radius, segments,rings),
    particle_materials[i]);

  sphere.position.x=pos[0];
  sphere.position.y=pos[1];
  sphere.position.z=pos[2];
  sphere.is_particle = true;
  sphere.particle_i = i;
  // add the sphere to the scene
  scene.add(sphere);
  particle_meshes.push( sphere );
}

var transp_material = new THREE.MeshBasicMaterial( { color: 0x555555, transparent: true, blending: THREE.AdditiveBlending } );
var transp_sphere = new THREE.Mesh(
    new THREE.SphereGeometry(
      1.2, segments,rings),
    transp_material);
transp_sphere.visible=false;


//Edges initialization  
var edge_meshes = new Array(0);
for (i = 0; i < three_d_scene.edges.length; i++) {
  var edge = three_d_scene.edges[i];
  var edge_radius = three_d_scene.edges_radii[i];
  var pos1 = three_d_scene.getPosition(edge[0]);
  var pos2 = three_d_scene.getPosition(edge[1]);
  pos1 = new THREE.Vector3( pos1[0], pos1[1], pos1[2] );
  pos2 = new THREE.Vector3( pos2[0], pos2[1], pos2[2] );

  var height = pos1.distanceTo(pos2);
  var position  = pos2.clone().add(pos1).divideScalar(2);

  var edge_geometry = new THREE.CylinderGeometry( edge_radius, edge_radius, 1, 32 );
  edge_geometry.applyMatrix( new THREE.Matrix4().makeRotationFromEuler( new THREE.Euler( Math.PI / 2, Math.PI, 0 ) ) );
  var edge_material = new THREE.MeshBasicMaterial( {color: edge_colors[i]} );
  // var edge_material = new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0x666666, emissive: edge_colors[i], ambient: 0x000000, shininess: 10, shading: THREE.SmoothShading, opacity: 0.9, transparent: true } );
  var cylinder = new THREE.Mesh( edge_geometry, edge_material );

  cylinder.scale.z = height;
  cylinder.position.x=position.x;
  cylinder.position.y=position.y;
  cylinder.position.z=position.z;
  cylinder.lookAt(pos2);

  scene.add( cylinder );
  edge_meshes.push(cylinder);
}
//End of edges initialization

//Paths initialization
var path_geometries = []
for (var i=0; i<paths.length;i++){
  var material = new THREE.LineBasicMaterial({
    color: paths[i].color
  });
  var geometry = new THREE.Geometry();
  for (var j=0;j< paths[i].max_list_size ;j++)
    geometry.vertices.push(new THREE.Vector3( 0, 0, 0 ));
  path_geometries.push(geometry);
  var line = new THREE.Line( geometry, material );
  scene.add( line );
}
//End of paths initialization

function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );}
window.addEventListener( 'resize', onWindowResize, false );

do_stuff_before_render();

var render = function () {
  three_d_scene = integrator.stepScene(three_d_scene, dt)

  // Move particles
  for (i = 0; i < three_d_scene.num_particles; i++) {
    var pos = three_d_scene.getPosition(i);
    var p0 = new THREE.Vector3( pos[0], pos[1], pos[2] );
    var dist = p0.length();
    var radius = three_d_scene.radii[i];
    if ((dist-radius) < bottom_radius){
      p0=p0.normalize();
      pos[0]=p0.x*(bottom_radius+radius);
      pos[1]=p0.y*(bottom_radius+radius);
      pos[2]=p0.z*(bottom_radius+radius);
      three_d_scene.setVelocity(i, [0,0,0]);
      three_d_scene.setPosition(i, pos);}
    var sphere = particle_meshes[i];
    sphere.position.x=pos[0];
    sphere.position.y=pos[1];
    sphere.position.z=pos[2];
    sphere.visible=show_particles;

  }

  // Move edges
  for (i = 0; i < three_d_scene.edges.length; i++) {
    var edge_info = three_d_scene.edges[i];
    var pos1 = three_d_scene.getPosition(edge_info[0]);
    var pos2 = three_d_scene.getPosition(edge_info[1]);
    pos1 = new THREE.Vector3( pos1[0], pos1[1], pos1[2] );
    pos2 = new THREE.Vector3( pos2[0], pos2[1], pos2[2] );

    var height = pos1.distanceTo(pos2);
    var position  = pos2.clone().add(pos1).divideScalar(2);
  
    cylinder.visible=show_edges;
    cylinder=edge_meshes[i];
    cylinder.scale.z = height;
    cylinder.position.x=position.x;
    cylinder.position.y=position.y;
    cylinder.position.z=position.z;
    cylinder.lookAt(pos2);
  }

  // Paths update and rendering
  for (i = 0; i < paths.length; i++){
    pos = three_d_scene.getPosition(paths[i].particle_i);
    paths[i].addToPath(pos);
  }
  for (var i=0; i<paths.length;i++){
    path = paths[i];
    var geometry = path_geometries[i];
    var max_n = path.max_list_size;
    for ( var j = 0, l = max_n; j < l; j ++ ) {
      pos_temp = path.getPoint(j);
      if (pos_temp != undefined) pos = pos_temp;
      geometry.vertices[ j ].x = pos[0];
      geometry.vertices[ j ].y = pos[1];
      geometry.vertices[ j ].z = pos[2];
    }
    geometry.verticesNeedUpdate = true;
  }
  // End of paths update and rendering

  // find intersections
  var vector = new THREE.Vector3( mouse.x, mouse.y, 1 ).unproject( camera );
  raycaster.set( camera.position, vector.sub( camera.position ).normalize() );
  var intersects = raycaster.intersectObjects( scene.children );
  if ( intersects.length > 0 ) {
    INTERSECTED_aux = intersects[ 0 ].object;
    if (INTERSECTED_aux.particle_i==0 && intersects.length > 1) INTERSECTED_aux = intersects[ 1 ].object;
    if ( INTERSECTED != INTERSECTED_aux ) {
      // if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
        if ( INTERSECTED_aux.is_particle && INTERSECTED_aux.particle_i > 1){
        var part_i = INTERSECTED_aux.particle_i;
        INTERSECTED = INTERSECTED_aux;
        var radius = three_d_scene.radii[part_i];
        transp_sphere.visible=true;
        INTERSECTED.add(transp_sphere);
        // INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
        // INTERSECTED.material.emissive.setHex( 0xff0000 );
      } else {INTERSECTED=null; transp_sphere.visible=false;}
    }
  } else {
    // if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
    INTERSECTED = null;
    transp_sphere.visible=false;
  }
  if (mouse_clicked && !button_clicked && INTERSECTED && INTERSECTED.particle_i > 1){
      var part_i = INTERSECTED.particle_i;
      var sphere = particle_meshes[part_i];
      if (leftclick){
        sphere.scale.x += 0.1;
        sphere.scale.y += 0.1;
        sphere.scale.z += 0.1;
        radii_scale[part_i] += 0.1;}
      else{
        sphere.scale.x -= 0.1;
        sphere.scale.y -= 0.1;
        sphere.scale.z -= 0.1;
        radii_scale[part_i] -= 0.1;}
      three_d_scene.radii[part_i] = original_radii[part_i]*radii_scale[part_i];
  }

  raycaster.set( camera.position, vector.sub( camera.position ).normalize() );
  button_clicked=false;
  mouse_clicked = false;

  do_stuff();
  controls.update();
  requestAnimationFrame( render );
  renderer.render(scene, camera);
};

  render();