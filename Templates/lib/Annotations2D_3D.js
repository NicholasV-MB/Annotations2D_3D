function mainAnnotations2D_3D(){
	// Assegnazione variabili
	// Input da/verso processo
	var input_LayoutData = document.getElementById("RDVAR_LayoutData");
	var input_Annotations = document.getElementById("RDVAR_Annotations");
	var input_HPiano = document.getElementById("RDVAR_HPiano");
	var input_LPiano = document.getElementById("RDVAR_LPiano");
	// Variabili Editor Annotazioni
	var Canvas3D = document.getElementById("Canvas3D");
	Canvas3D.innerWidth = 0.4*window.innerWidth;
	Canvas3D.innerHeight = window.innerHeight;
	var Canvas2D = document.getElementById("Canvas2D");
	Canvas2D.innerWidth = 0.4*window.innerWidth;
	Canvas2D.innerHeight = window.innerHeight;
	var GUICanvas = document.getElementById("GUICanvas");
	GUICanvas.innerWidth = 0.2*window.innerWidth;
	GUICanvas.innerHeight = window.innerHeight;
	var scene2D, camera2D, renderer2D, controls2D, stats2D;
	var floor, gui;
	var height = parseInt(input_HPiano.value);
	var width = parseInt(input_LPiano.value);
	var campata_selected, train_selected;
	var all_campate = [];
	var all_trains = [];
	var floor_name = "Floor";
	var train_name = "Treno";
	var campata_name = "Campata";
	var point_material = new THREE.LineBasicMaterial({
		color: 0x000000
	});
	var spalla_material = new THREE.MeshBasicMaterial( {color: 0x0000FF, transparent:true} );
	var corrente_material = new THREE.MeshBasicMaterial( {color: 0xFFFF00, transparent:true} );
	var traversino_material = new THREE.MeshBasicMaterial( {color: 0x808080, transparent:true} );
	var colori = ["Verde", "Ocra", "Rosso"];
	var interventi = ["Monitorare", "Sostiuire", "Altro"];
	var spalla_name = "Spalla";
	var corrente_name = "Corrente";
	var traversino_name = "Traversino";
	var scene3D, camera3D, renderer3D, controls3D, stats3D, axesHelper;
	var spalle = [];
	var all_objects = [];
	var idx_annotation = 1;
	var add_annotation_mode = false;
	var colors = {
		"Verde": 0x00ff00,
		"Ocra": 0xaea04b,
		"Rosso": 0xff0000
	}
	// settings della gui
	var settings = {
		AddNew: function(){
			add_annotation_mode=true;
		}
	}

	
	// Avvio delle funzioni principali
	Start2D();		
	Update2D();

	// Funzione che setta il font della dat.gui
	function setGuiSize(){
		var elements = document.getElementsByClassName("dg");
		for(var el of elements){
			el.style.fontSize = "16px";
		}
	}
	
	// Funzione per modificare la visualizzazione quando la finestra viene ridimensionata
	function onResize() {
		Canvas2D.innerWidth = 0.4*window.innerWidth;
		Canvas2D.innerHeight = window.innerHeight;
		renderer2D.setSize( Canvas2D.innerWidth, Canvas2D.innerHeight );
		camera2D.left = Canvas2D.innerWidth / - 2;
		camera2D.right = Canvas2D.innerWidth / 2;
		camera2D.top = Canvas2D.innerHeight / 2;
		camera2D.bottom = Canvas2D.innerHeight / -2;
		camera2D.updateProjectionMatrix();
		GUICanvas.innerWidth = 0.2*window.innerWidth;
		GUICanvas.innerHeight = window.innerHeight;
		Canvas3D.innerWidth = 0.4*window.innerWidth;
		Canvas3D.innerHeight = window.innerHeight;
		camera3D.aspect = Canvas3D.innerWidth/Canvas3D.innerHeight;
		renderer3D.setSize( Canvas3D.innerWidth, Canvas3D.innerHeight );
		camera3D.updateProjectionMatrix();
		if ( gui !== undefined){
			gui.width = GUICanvas.innerWidth;
		}
	}

	// Funzione che genera la scena all'apertura della pagina web
	function Start2D() {
		// Scena
		scene2D = new THREE.Scene();
		scene2D.name= "Scene";
		// Camera
		camera2D = new THREE.OrthographicCamera(100* Canvas2D.innerWidth  / - 2, 100*Canvas2D.innerWidth  / 2, 100*Canvas2D.innerHeight / 2,100* Canvas2D.innerHeight / - 2, 0, 9999999999999999999  );
		camera2D.position.set(75000, 100000, 75000);
		camera2D.zoom=0.003;
		camera2D.updateProjectionMatrix();
		camera2D.name = "Camera";
		scene2D.add(camera2D);
		// Render	
		renderer2D = new THREE.WebGLRenderer( {antialias: true} );
		renderer2D.setSize( Canvas2D.innerWidth, Canvas2D.innerHeight );
		renderer2D.setClearColor( 0x252850 );
		renderer2D.setPixelRatio( Canvas2D.devicePixelRatio );
		Canvas2D.appendChild( renderer2D.domElement );
		// Controllo dei moviementi della camera
		controls2D = new THREE.OrbitControls( camera2D, renderer2D.domElement  );
		controls2D.addEventListener( 'change', Render2D );
		controls2D.target.set(75000, 0, 75000);
		controls2D.update();
		// Statistiche fps in alto a sinistra del canvas
		stats2D = new Stats();
		stats2D.domElement.style.position = 'absolute';
		stats2D.domElement.style.top = '2px';
		stats2D.domElement.style.right = '2px';
		stats2D.domElement.style.left = 'auto';
		Canvas2D.appendChild( stats2D.domElement );
		// Chiama onResize() quando viene modificata la dimensione della pagina
		window.addEventListener( 'resize', onResize, false );
		
		// Chiamata a funzioni che disegnano il pavimento e rigenenera la scena
		drawFloor();	
		restoreScene();	
		removeElFromScene("Helper");
		train_selected = undefined;
		campata_selected = undefined;
	}

	// Funzione per l'aggiornamento della pagina
	function Update2D() {
		camera2D.position.setX(controls2D.target.x);
		camera2D.position.setZ(controls2D.target.z);
		controls2D.update();
		stats2D.update();
		// Setta la grandezza del font della scritta all'interno delle campate in base allo zoom (TODO da migliorare)
		if(all_campate.length>0 ){
			all_campate.forEach( camp =>{
				camp.children.forEach(obj =>{
					if(obj.name=="Testo") {	
						obj.fontSize = 35/camera2D.zoom;
					}
				});
			});
		}
		Render2D();
		requestAnimationFrame( Update2D );
	}

	// Funzione per effettuare il render della pagina
	function Render2D(){
		renderer2D.render(scene2D, camera2D);
	}
	

	// Funzione che disegna il pavimento
	function drawFloor(){
		if (height>0 && width>0){	
			var geometry = new THREE.BoxGeometry( width, 1, height );
			var material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
			floor = new THREE.Mesh( geometry, material );
			floor.position.set(width/2, 0, height/2);
			floor.name=floor_name;
			scene2D.add( floor );
		} 
	}
	
	// Funzione che rigenera la scena dal valore di "input_LayoutData"
	function restoreScene(){
		if (input_LayoutData.value.length>0){
			var str_val = input_LayoutData.value;
			var json_data = JSON.parse(str_val);
			var trains_data =  json_data.UserData;
			trains_data.forEach(t_data =>{
				var id = t_data.userData.id;
				var start_p = t_data.userData.start_p;
				var lunghezza = t_data.userData.Lunghezza;
				var profondita = t_data.userData.profondita;
				var altezza = t_data.userData.Altezza;
				var campate = t_data.userData.Campate;
				var doppiaspalla = t_data.userData.doppiaspalla;
				var showNames = t_data.userData.showNames;
				var livellixCampata = t_data.userData.Livelli;
				var rotazione = t_data.userData.Rotazione;
				draw2Dtrain( id, start_p, lunghezza, profondita, altezza, campate, doppiaspalla, showNames, livellixCampata);
				scene2D.children.forEach(c=>{
					if(c.name==train_name+"-"+id){
						train_selected = c;
					}
				});
				restore_rotation(rotazione);
				t_data.children.forEach(c => {
					train_selected.children.forEach(c_s =>{
						if(c.name==c_s.name){
							c_s.userData = c.userData;
						}
					});
				});
			});
			get_trains();
		} 
	}

	// Funzione per rimuovere dalla scena 2D tutti elementi che hanno l'attributo name="name"
	function removeElFromScene(name){
		var toRemove = [];
		scene2D.traverse(child =>{
			if(child.name===name){
				toRemove.push(child);
			}
		});
		toRemove.forEach(el => {
			el.parent.remove(el);
		});
		get_trains();
	}

	// Funzione che aggiorna gli array all_trains e all_campate;
	function get_trains(){
		all_trains = [];
		scene2D.traverse(child =>{
			if (child.name.startsWith(train_name)){
				all_trains.push(child);
			}
		});
		all_campate = [];
		all_trains.forEach(t=>{
			t.children.forEach(child => {
				if (child.name !="Helper") { 
					all_campate.push(child)
				}
			});
		});
	}

	
	// Disegna singolo treno in 2D
	function draw2Dtrain(id_train, start_p, lunghezza, profondita, altezza, campate, doppiaspalla, showNames, livelli){
		var dist_doppia_spalla = 100;
		var train_points = [];
		train_points.push(start_p);
		var interval = lunghezza/campate;
		var campate_treno = []; 
		for (var c = 1; c<=campate; c++){
			var p1 = new THREE.Vector3(start_p.x+(interval*c), altezza, start_p.z);
			var p2 = new THREE.Vector3(start_p.x+(interval*c), altezza, start_p.z+profondita);
			if (doppiaspalla && c<campate){
				var min = new THREE.Vector3(p1.x-interval, altezza, p1.z);
				p1.x -= dist_doppia_spalla;
				p2.x -= dist_doppia_spalla;
				var max = new THREE.Vector3(p2.x, p2.y, p2.z);
				train_points.push(new THREE.Vector3(p1.x, p1.y, p1.z));
				train_points.push(new THREE.Vector3(p2.x, p2.y, p2.z));
				p2.x += (2*dist_doppia_spalla);
				train_points.push(new THREE.Vector3(p2.x, p2.y, p2.z));
				p1.x += (2*dist_doppia_spalla);
				train_points.push(new THREE.Vector3(p1.x, p1.y, p1.z));
				p1.x -= (2*dist_doppia_spalla);
				train_points.push(new THREE.Vector3(p1.x, p1.y, p1.z));
			} else {
				var min = new THREE.Vector3(p1.x-interval, altezza, p1.z);
				var max = p2;
				train_points.push(p1);
				train_points.push(p2);
				train_points.push(p1);
			}
			if (doppiaspalla && c>1){ min.x += dist_doppia_spalla; } 
			var box3 = new THREE.Box3(
				min,
				max
			);
			var box = new THREE.OBB().fromBox3(box3);
			var c_name = id_train+"-"+c;
			var center = box.center;
			var campata = new THREE.Object3D();
			campata.position.set(center.x, center.y, center.z);
			campata.boundingBox = box;
			campata.name = c_name;
			var sprite = createSprite(c_name);
			sprite.visible = showNames; 
			campata.add(sprite);
			campate_treno.push(campata);
		}			
		var end_p = new THREE.Vector3(lunghezza+start_p.x, altezza,  start_p.z+profondita);
		train_points.push(end_p);
		var p = new THREE.Vector3(start_p.x, altezza, start_p.z+profondita);
		train_points.push(p, start_p);
		var train_geom = new THREE.BufferGeometry().setFromPoints(train_points);
		var train_mesh = new THREE.Line( train_geom, point_material);
		train_mesh.name = train_name+"-"+id_train;
		train_mesh.geometry.computeBoundingBox();
		campate_treno.forEach(camp => train_mesh.add(camp));
		var u_data = {
			id: id_train,
			start_p: start_p,
			Lunghezza: lunghezza,
			profondita: profondita,
			Altezza: altezza,
			Campate: campate,
			doppiaspalla: doppiaspalla,
			showNames: showNames,
			Livelli: livelli,
			Rotazione: 0
		}
		train_mesh.userData = u_data;
		train_mesh.renderOrder = 1;
		scene2D.add(train_mesh);
		all_campate = all_campate.concat(campate_treno);	
	}

	// Crea testo
	function createSprite(name){
		var sprite = new THREE.TextSprite({
			text:  name,
			fontFamily: 'Arial, Helvetica, sans-serif',
			fontSize: 100, //+ (10/camera2D.zoom),
			color: '#000000',
			
		});
		sprite.name="Testo";
		sprite.position.setY(camera2D.position.y-10000);
		return sprite;
	}

	// Genera una geometria a partire da un OBB (Oriented Bounding Box https://threejs.org/docs/#examples/en/math/OBB )
	function geom_from_obb(obb){
		var y = obb.center.y;
		var p1 = new THREE.Vector3(
			obb.center.x-obb.halfSize.x,
			y,
			obb.center.z-obb.halfSize.z
		).applyMatrix3(obb.rotation);
		var p2 = new THREE.Vector3(
			obb.center.x-obb.halfSize.x,
			y,
			obb.center.z+obb.halfSize.z
		).applyMatrix3(obb.rotation);
		var p3 = new THREE.Vector3(
			obb.center.x+obb.halfSize.x,
			y,
			obb.center.z+obb.halfSize.z
		).applyMatrix3(obb.rotation);
		var p4 = new THREE.Vector3(
			obb.center.x+obb.halfSize.x,
			y,
			obb.center.z-obb.halfSize.z
		).applyMatrix3(obb.rotation);
		var delta_x = (p1.x+p3.x)/2 - obb.center.x;
		var delta_z = (p1.z+p3.z)/2 - obb.center.z;
		p1.x -= delta_x;
		p1.z -= delta_z;
		p2.x -= delta_x;
		p2.z -= delta_z;
		p3.x -= delta_x;
		p3.z -= delta_z;
		p4.x -= delta_x;
		p4.z -= delta_z;
		var g = new THREE.BufferGeometry().setFromPoints([
			p1,
			p2,
			p3,
			p4,
			p1
		]);
		return g;
	}
	
	// Mostra il treno selezionato con in grigio e, se presente, la campata selezionata in rosso 
	function showTrainSelection(){
		removeElFromScene("Helper");
		train_selected.children.forEach(child => {
			var draw = false;
			if(campata_selected == undefined ){
				draw = true;
			} else {
				if (child.name !== campata_selected.name){
					draw = true;
				}
			}
			if (draw==true){
				var geom = geom_from_obb(child.boundingBox);
				var helper = new THREE.Line(geom, new THREE.LineBasicMaterial({color: 0x808080}));
				helper.name = "Helper";
				helper.renderOrder=2;
				train_selected.add(helper);
			}
		});
		if (campata_selected !== undefined){
			var geom = geom_from_obb(campata_selected.boundingBox);
			var helper = new THREE.Line(geom, new THREE.LineBasicMaterial({color: 0xff0000}));
			helper.name = "Helper";
			helper.renderOrder=2;
			train_selected.add(helper);
		}
	}

	
	// Funzione che ripristina la rotazione del treno
	function restore_rotation(val){
		var alpha = val*Math.PI/180;
		train_selected.userData.Rotazione = val;
		if (campata_selected !== undefined){
			var xc = campata_selected.boundingBox.center.x;
			var zc = campata_selected.boundingBox.center.z;
		} else {
			train_selected.geometry.computeBoundingSphere();
			var xc = train_selected.geometry.boundingSphere.center.x;
			var zc = train_selected.geometry.boundingSphere.center.z;
		}
		train_selected.geometry.rotateY(alpha);
		train_selected.geometry.computeBoundingSphere();
		var x = train_selected.userData.start_p.x;
		var z = train_selected.userData.start_p.z;	
		train_selected.userData.start_p.x = (x-xc)*Math.cos(-alpha)-(z-zc)*Math.sin(-alpha)+xc;
		train_selected.userData.start_p.z = (x-xc)*Math.sin(-alpha)+(z-zc)*Math.cos(-alpha)+zc;
		train_selected.geometry.translate(
			train_selected.userData.start_p.x-train_selected.geometry.attributes.position.array[0],
			0,
			train_selected.userData.start_p.z-train_selected.geometry.attributes.position.array[2]
		);
		train_selected.children.forEach(child =>{
			if (child.name !== "Helper"){
				var x = child.position.x;
				var z = child.position.z;
				child.boundingBox.rotation = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationY(alpha));
				child.position.x = (x-xc)*Math.cos(-alpha)-(z-zc)*Math.sin(-alpha)+xc;
				child.position.z = (x-xc)*Math.sin(-alpha)+(z-zc)*Math.cos(-alpha)+zc;
				child.boundingBox.center.x = child.position.x;
				child.boundingBox.center.z = child.position.z;
				child.children.forEach(c=>{
					if(c.name!="Testo"){
						c.rotation.y= alpha;
					}
				});
			}
		});
		restore_selection();
	}
	
	// Funzione che ripristina la selezione del treno e della campata
	function restore_selection(){
		var changed = false;
		scene2D.traverse(child=>{
			if(child.name==train_selected.name){
				train_selected=child;
			} else if(campata_selected!== undefined){
				if(child.name==campata_selected.name){
					campata_selected = child;
					changed = true;
				}
			} 
		});
		if (changed==false) {
			campata_selected = undefined;
		}
		showTrainSelection();
	}
	

	// Gestione eventi mouse
	// Variabili
	var raycaster2D = new THREE.Raycaster();
	var mouse2D = new THREE.Vector2();
	 

	// Eventi nel canvas 2D
	// Movimento del puntatore
	Canvas2D.addEventListener("pointermove", event => {
		mouse2D.x = ( (event.clientX-(window.innerWidth*0.2)) / Canvas2D.innerWidth ) * 2 - 1;
		mouse2D.y = - ( event.clientY / Canvas2D.innerHeight ) * 2 + 1;
		raycaster2D.setFromCamera(mouse2D, camera2D);
	});

	// Pressione click mouse
	Canvas2D.addEventListener("pointerdown", () => { 
		if (train_selected !== undefined){
			var intersects = raycaster2D.intersectObjects([floor]);
			if (intersects.length > 0) {
				removeElFromScene("Helper");
				train_selected = undefined;
				campata_selected = undefined;
				clear3DScene();
				clearGui();
			}
		}
		get_trains();
		var obj = [];
		all_campate.forEach(c=>{
			if(c.boundingBox.intersectsRay(raycaster2D.ray)){
				campata_selected = c;
				train_selected = campata_selected.parent;
				showTrainSelection();
				showCampata3D();
			}
		});
	} );
	
	// Funzioni canvas 3D
	
	// Funzione per eliminare l'annotazione al click della GUI
	var EliminaAnnotazione = function() {
		var object = scene3D.getObjectByName("Annotazione "+this.id);
		if (object!= undefined){object.parent.remove(object)}
		for(var key in campata_selected.userData.Annotazioni){
			if (key >this.id ){
				campata_selected.userData.Annotazioni[key].id -=1;
				campata_selected.userData.Annotazioni[key-1] = campata_selected.userData.Annotazioni[key];
				var obj = scene3D.getObjectByName("Annotazione "+key);
				campata_selected.userData.Annotazioni[key-1].posizione.parentID = (key-1);
				if(obj!=undefined){
					obj.name = "Annotazione "+(key-1);
				}
			}
		}
		delete campata_selected.userData.Annotazioni[key];
		idx_annotation -= 1;
		if ( Object.keys(campata_selected.userData.Annotazioni).length==0){
			campata_selected.children.forEach(c=>{
				if (c.name=="Annotazione"){
					campata_selected.remove(c);
				}
			});
		}
		UpdateAnnotazioniGUI();
	}
	
	// Avvio funzioni prncipali del canvas3D
	Start3D();
	Update3D();
	

	// funzione che crea la visualizzazione 3D all'avvio della pagina
	function Start3D(){
		// scena
		scene3D = new THREE.Scene();
		scene3D.name= "Scene3D";
		// camera
		camera3D = new THREE.PerspectiveCamera( 100, Canvas3D.innerWidth / Canvas3D.innerHeight, 0.00001, 10000000000 );
		camera3D.position.set(75000,75000,150000);
		camera3D.updateProjectionMatrix();
		camera3D.name = "Camera3D";
		scene3D.add(camera3D);
		// render	
		renderer3D = new THREE.WebGLRenderer( {antialias: true} );
		renderer3D.setSize( Canvas3D.innerWidth, Canvas3D.innerHeight );
		renderer3D.setClearColor( 0x4f5f80 );
		renderer3D.setPixelRatio( Canvas3D.devicePixelRatio );
		Canvas3D.appendChild( renderer3D.domElement );
		// controllo dei moviementi della camera
		controls3D = new THREE.OrbitControls( camera3D, renderer3D.domElement  );
		controls3D.addEventListener( 'change', Render3D );
		controls3D.target.set(75000, 0, 75000);
		controls3D.update();
		// statistiche fps in alto a sinistra
		stats3D = new Stats();
		stats3D.domElement.style.position = 'absolute';
		stats3D.domElement.style.top = '2px';
		stats3D.domElement.style.right = '2px';
		stats3D.domElement.style.left = 'auto';
		Canvas3D.appendChild( stats3D.domElement );
		// helper per conoscere l'orientamento degli assi
		axesHelper = new THREE.AxesHelper( 50000 );
		axesHelper.name = "axesHelper";
		scene3D.add( axesHelper );
		restore_annotations();
	}
	
	
	
	// Funzione per rigenare le annotazioni dal valore passato dal processo
	function restore_annotations(){
		get_trains();
		all_campate.forEach(c =>{
			var treno = c.name.split("-")[0];
			var campata = c.name.split("-")[1];
			for (var ann of JSON.parse(input_Annotations.value)){
				if(treno == ann.Treno && campata == ann.Campata){
					if ( c.userData.Annotazioni == undefined) { c.userData.Annotazioni = {} }
					var oggetto_name = c.name+"-"+ann.Oggetto;
					c.userData.Annotazioni[ann.ID] = {
						"Oggetto": { "name": oggetto_name},
						"id": ann.ID,
						"Livello": ann.Livello,
						"posizione": {
							"x": ann.Posizione.x,
							"y": ann.Posizione.y,
							"z": ann.Posizione.z,
							"parentID": ann.ID
						},
						"Intervento": ann.Intervento,
						"Nota": ann.Nota,
						"Foto": ann.Foto,
						"Elimina": EliminaAnnotazione,
					}	
					var material = new THREE.MeshBasicMaterial( {color: colors[ann.Livello], transparent:true} );
					campata_selected = c;
					train_selected = c.parent;
					showAnn2D(material);
					campata_selected=undefined;
					train_selected=undefined;
				}
			}	
		});
	}

	// Funzione che costruisce la GUI quando viene selezionata una campata
	function buildGui(){
		clearGui();
		gui.add(settings, "AddNew").name("Aggiungi Nuova Annotazione");
		UpdateAnnotazioniGUI();
	}

	// Funzione che modifica la gui 3D al variare del numero di annotazioni presenti
	function UpdateAnnotazioniGUI(){
		var to_remove = [];
		for(var key in gui.__folders){
			if(key.includes("Annotazione")){
				to_remove.push(key);
			}
		}
		to_remove.forEach(child => {
			gui.__ul.removeChild(gui.__folders[child].domElement.parentNode);
			delete gui.__folders[child];
		});
		var to_delete = [];
		for(var key in campata_selected.userData.Annotazioni){
			var nome = campata_selected.userData.Annotazioni[key].Oggetto.name;
			if (scene3D.getObjectByName(nome) != undefined){
				var folder_name = "Annotazione "+key;
				var current_folder = gui.addFolder(folder_name);
				campata_selected.userData.Annotazioni[key].Oggetto = scene3D.getObjectByName(nome);
				var bb = new THREE.Box3().setFromObject(campata_selected.userData.Annotazioni[key].Oggetto);
				current_folder.add(campata_selected.userData.Annotazioni[key], "Livello", colori).onFinishChange(function(newVal){
					drawAnnotation(this.object);
				});
				var pos = current_folder.addFolder(	"Posizione "+nome);
				pos.add(campata_selected.userData.Annotazioni[key]["posizione"], "x").min(bb.min.x).max(bb.max.x).onChange(function(newVal){
					var obj = scene3D.getObjectByName("Annotazione "+this.object.parentID);
					obj.position.x = newVal;
				});
				pos.add(campata_selected.userData.Annotazioni[key]["posizione"], "y").min(bb.min.y).max(bb.max.y).onChange(function(newVal){
					var obj = scene3D.getObjectByName("Annotazione "+this.object.parentID);
					obj.position.y = newVal;
				});
				pos.add(campata_selected.userData.Annotazioni[key]["posizione"], "z").min(bb.min.z).max(bb.max.z).onChange(function(newVal){
					var obj = scene3D.getObjectByName("Annotazione "+this.object.parentID);
					obj.position.z = newVal;
				});
				current_folder.add(campata_selected.userData.Annotazioni[key], "Intervento", interventi);
				current_folder.add(campata_selected.userData.Annotazioni[key], "Nota");
				current_folder.add(campata_selected.userData.Annotazioni[key], "Foto");  			// TODO UPLOAD FOTO
				current_folder.add(campata_selected.userData.Annotazioni[key], "Elimina");
				drawAnnotation(campata_selected.userData.Annotazioni[key]);
			}
		}	
		if(to_delete.length>0){
			to_delete.forEach(el =>{
				if (campata_selected.userData.Annotazioni[el] !== undefined) {
					campata_selected.userData.Annotazioni[el].Elimina();
				}
			});
		}
		setGuiSize();
		gui.width = GUICanvas.innerWidth;
	}

	// Funzione di update della scena 3D
	function Update3D(){
		evaluate_annotations();
		controls3D.update();
		stats3D.update();
		Render3D();
		requestAnimationFrame( Update3D );
	}
	
	// Funzione di render della scena 3D
	function Render3D(){
		renderer3D.render(scene3D, camera3D);
	}

	// Funzione per ripulire la scena 3D da tutti gli elementi diversi da camera e helper degli assi
	function clear3DScene(){
		var to_remove = [];
		scene3D.children.forEach(child =>{
			if(child.name!=camera3D.name && child.name!=axesHelper.name){
				to_remove.push(child);
			}
		});
		to_remove.forEach(child => {
			scene3D.remove(child);
		});
	}

	// Funzione per valorizzare le annotazioni da restituire al processo
	function evaluate_annotations(){
		get_trains();
		var all_annotazioni = [];
		all_campate.forEach(c=>{
			if (c.userData.Annotazioni != undefined &&  Object.keys(c.userData.Annotazioni).length>0){
				for ( var key in c.userData.Annotazioni ){
					var ann = c.userData.Annotazioni[key];
					var nome_oggetto = ann.Oggetto.name;
					var my_ann_json = {
						"Treno": nome_oggetto.split("-")[0],
						"Campata": nome_oggetto.split("-")[1],
						"Oggetto": nome_oggetto.split("-").slice(2).join("-"),
						"ID": ann.id,
						"Livello": ann.Livello,
						"Posizione": JSON.stringify({
							"x": ann.posizione.x,
							"y": ann.posizione.y,
							"z": ann.posizione.z,
						}),
						"Intervento": ann.Intervento,
						"Nota": ann.Nota,
						"Foto": ann.Foto,
					}
					all_annotazioni.push(my_ann_json);
				}
			}
		});
		input_Annotations.value = JSON.stringify(all_annotazioni);
	}

	// Funzione per visualizzare la campata selezionata in 3D
	function showCampata3D(){
		clear3DScene();
		if(campata_selected.userData.Altezza == undefined){campata_selected.userData.Altezza=train_selected.userData.Altezza}
		var g = geom_from_obb(campata_selected.boundingBox);
		spalle = [];
		if(campata_selected.userData.Livelli == undefined){
			campata_selected.userData.Livelli=train_selected.userData.Livelli
			campata_selected.userData.AltezzeLivelli={};
		} 
		if ( campata_selected.userData.Livelli != Object.keys(campata_selected.userData.AltezzeLivelli).length) {
			campata_selected.userData.AltezzeLivelli={};
			var interval = campata_selected.userData.Altezza/campata_selected.userData.Livelli;
			for(var n = 1; n<=campata_selected.userData.Livelli; n++){
				campata_selected.userData.AltezzeLivelli[n.toString()] = interval*n -5;
			}
		}
		if(campata_selected.userData.Annotazioni == undefined){ campata_selected.userData.Annotazioni = {} }
		idx_annotation = Object.keys(campata_selected.userData.Annotazioni).length +1;
		var in_corr = false;
		var word = "Sx";
		for (var idx = 0; idx<(g.attributes.position.array.length-3); idx=idx+3){
			var spalla = drawSpallaPP(g.attributes.position.array[idx], campata_selected.userData.Altezza, g.attributes.position.array[idx+2]);
			spalla.name = campata_selected.name+"-"+spalla_name+"-"+(idx/3+1);
			var theta = Math.atan(
				(g.attributes.position.array[idx]-g.attributes.position.array[idx+3])/
				(g.attributes.position.array[idx+2]-g.attributes.position.array[idx+5])
			)*180/ Math.PI - 90;
			spalla.rotation.y = theta*Math.PI/180;
			scene3D.add(spalla);
			var s_p = new THREE.Vector3(g.attributes.position.array[idx], 0, g.attributes.position.array[idx+2]);
			var e_p = new THREE.Vector3(g.attributes.position.array[idx+3], 0, g.attributes.position.array[idx+5]);
			var h_min  = 50;
			if(idx==3){
				word="Front";
			} else if(idx==6){
				word="Dx";
			} else if (idx==9){
				word="Back";
			}
			for(key in  campata_selected.userData.AltezzeLivelli){
				if(in_corr==true){
					var corr = drawCorrentePP(s_p, e_p, campata_selected.userData.AltezzeLivelli[key]);
					corr.name = campata_selected.name+"-"+corrente_name+"-"+word+"-"+key;
					scene3D.add(corr);
				} else {
					if (key=="1"){
						var to = drawTraversinoOrPP(s_p, e_p, h_min);
						to.name = campata_selected.name+"-"+traversino_name+"Orizzontale-"+word+"-"+0;
						scene3D.add(to);
						// resetAnnPos(to);
					}
					var to = drawTraversinoOrPP(s_p, e_p, campata_selected.userData.AltezzeLivelli[key]);
					to.name = campata_selected.name+"-"+traversino_name+"Orizzontale-"+word+"-"+key;
					scene3D.add(to);
					if (idx==0){
						var td = drawTraversinoDiagPP(e_p, s_p, campata_selected.userData.AltezzeLivelli[key], h_min);
					} else {
						var td = drawTraversinoDiagPP(s_p, e_p, campata_selected.userData.AltezzeLivelli[key], h_min);
					}
					td.name = campata_selected.name+"-"+traversino_name+"Diagonale-"+word+"-"+key;
					scene3D.add(td);
					h_min = campata_selected.userData.AltezzeLivelli[key];
				}
			}
			in_corr = ! in_corr;
		}
		controls3D.target.set(campata_selected.boundingBox.center.x,0,campata_selected.boundingBox.center.z);
		if(camera3D.position.distanceTo(controls3D.target)>35000){
			camera3D.position.set(campata_selected.boundingBox.center.x+1000,campata_selected.userData.Altezza+1000,10000+campata_selected.boundingBox.center.z);
		}
		buildGui();
	}

	// Funzione per disegnare una spalla del portapallet
	function drawSpallaPP(pos_x, h, pos_z){
		var geometry = new THREE.BoxGeometry( 100, h, 100 );
		var spalla = new THREE.Mesh( geometry, spalla_material );
		spalla.position.set(pos_x, (1+h)/2, pos_z);
		return spalla;
	}
	
	// Funzione per disegnare un corrente del portapallet 
	function drawCorrentePP(pos_s, pos_e, h){
		var dim = pos_s.distanceTo(pos_e)-100;
		var geometry = new THREE.BoxGeometry( dim, 100, 100 );
		var corrente = new THREE.Mesh( geometry, corrente_material );
		corrente.position.set((pos_s.x+pos_e.x)/2, h, (pos_s.z+pos_e.z)/2);
		var theta = Math.atan((pos_s.x-pos_e.x)/(pos_s.z-pos_e.z))*180/ Math.PI - 90;
		corrente.rotation.y = theta*Math.PI/180;
		return corrente;
	}
	
	// Funzione per disegnare un traversino orizzontale
	function drawTraversinoOrPP(pos_s, pos_e, h){
		var dim = pos_s.distanceTo(pos_e)-100;
		var geometry = new THREE.CylinderGeometry( 30, 30, dim, 32 );
		var traversinoOr = new THREE.Mesh( geometry, traversino_material );
		traversinoOr.position.set((pos_s.x+pos_e.x)/2, h, (pos_s.z+pos_e.z)/2);
		traversinoOr.rotation.x = 90*Math.PI/180;
		var theta = Math.atan((pos_s.z-pos_e.z)/(pos_s.x-pos_e.x))*180/ Math.PI + 90;
		traversinoOr.rotation.z = theta*Math.PI/180;
		return traversinoOr;
	}
	
	// Funzione per disegnare un traversino diagonale 
	function drawTraversinoDiagPP(pos_s, pos_e, h_max, h_min){
		var dim = Math.sqrt( Math.pow(pos_s.distanceTo(pos_e)-100, 2) + Math.pow(h_max-h_min-100, 2) );
		var geometry = new THREE.CylinderGeometry( 30, 30, dim, 32 );
		var traversinoDiag = new THREE.Mesh( geometry, traversino_material );
		traversinoDiag.position.set((pos_s.x+pos_e.x)/2, (h_max+h_min)/2, (pos_s.z+pos_e.z)/2);
		var theta = Math.atan(
			(h_max-h_min)/pos_s.distanceTo(pos_e)
		);
		var y = h_max-(dim/(2*Math.cos((Math.PI/2)-theta)))-100;
		traversinoDiag.lookAt(pos_e.x, y, pos_e.z );
		return traversinoDiag;
	}
	
	// Funzione per ripulire la GUI 3D
	function clearGui() {
		if ( gui ) {
			GUICanvas.removeChild(gui.domElement);
			gui == undefined;
		}
		gui = new dat.GUI( { autoPlace: false } );
		gui.domElement.setAttribute("style", "position: absolute; left: 2px; top: 2px");
		GUICanvas.appendChild(gui.domElement);
		gui.domElement.id = 'gui';
		gui.open();
	}
	
	// Funzione per popolare l'array "all_objects" con tutti gli oggetti della campata selezionata 
	function get_all_objects(){
		all_objects = [];
		scene3D.traverse(child => {
			if(child.name!=camera3D.name && child.name!=axesHelper.name && child.name!="Scene3D"){
				child.geometry.computeBoundingBox();
				child.geometry.computeBoundingSphere();
				all_objects.push(child);
			}
		});
	}
	
	// Funzione per disegnare una annotazione in corrispondenza dell'oggetto selezionato 
	function drawAnnotation(sets){
		scene3D.remove(scene3D.getObjectByName("Annotazione "+sets.id));
		geometry = new THREE.SphereGeometry( 100, 32, 32 );
		var material = new THREE.MeshBasicMaterial( {color: colors[sets.Livello], transparent:true} );
		var sphere = new THREE.Mesh( geometry, material );
		sphere.name = "Annotazione "+sets.id;
		sphere.position.set(
			sets["posizione"].x,
			sets["posizione"].y, 
			sets["posizione"].z
		);
		scene3D.add(sphere);
		showAnn2D(material);
	}
	
	// Funzione per mostrare l'aannotazione in 2D
	function showAnn2D(material){
		var ex_ann2D = undefined;
		campata_selected.children.forEach(c=>{
			if(c.name=="Annotazione"){
				ex_ann2D = c;
			}
		});
		if(ex_ann2D==undefined){
			var g = new THREE.BoxGeometry(campata_selected.boundingBox.halfSize.x*2, 0, campata_selected.boundingBox.halfSize.z*2 );
			var ann2D = new THREE.Mesh( g, material );
			ann2D.name="Annotazione";
			ann2D.rotation.y=train_selected.userData.Rotazione*Math.PI/180;
			ann2D.position.y = 1000;
			campata_selected.add(ann2D);
		} else {
			var r_found = false;
			var o_found = false;
			for(key in campata_selected.userData.Annotazioni){
				var a = campata_selected.userData.Annotazioni[key];
				if(a.Livello=="Rosso") {
					r_found = true;
				} else if(a.Livello=="Ocra"){
					o_found = true;
				}
			}
			if (r_found){
				var col = colors["Rosso"];
			} else if (o_found){
				var col = colors["Ocra"];
			} else {
				var col = colors["Verde"];
			}
			ex_ann2D.material.color.set(new THREE.Color(col));
		}
	}
	
	
	// Gestione eventi mouse nel canvas 3D
	// Variabili
	var raycaster3D = new THREE.Raycaster();
	var mouse3D = new THREE.Vector2();
	var point_found = false;
	
	
	// Eventi
	// Movimento del puntatore
	Canvas3D.addEventListener("pointermove", event => {
		mouse3D.x = ( (event.clientX-(window.innerWidth*0.6)) / Canvas3D.innerWidth ) * 2 - 1;
		mouse3D.y = - ( event.clientY / Canvas3D.innerHeight ) * 2 + 1;
		raycaster3D.setFromCamera(mouse3D, camera3D);
	});

	// Pressione click mouse
	Canvas3D.addEventListener("pointerdown", () => {
		if(add_annotation_mode==true){
			get_all_objects();
			var intersects = raycaster3D.intersectObjects(all_objects);
			if (intersects.length > 0) {
				controls3D.enabled = false;
				campata_selected.userData.Annotazioni[idx_annotation] = {
					id: idx_annotation,
					Livello: "Verde",
					posizione: new THREE.Vector3(
						intersects[0].point.x,
						intersects[0].point.y,
						intersects[0].point.z
					),
					Rotazione: train_selected.userData.Rotazione,
					Intervento: "Monitorare",
					Nota: "",
					Foto: "",
					Elimina: EliminaAnnotazione,
					Oggetto: intersects[0].object
				};
				campata_selected.userData.Annotazioni[idx_annotation].posizione.parentID = idx_annotation;
				point_found=true;
				idx_annotation += 1;
				UpdateAnnotazioniGUI();
			}
		}
	} );
	
	
	
	// Rilascio click mouse
	Canvas3D.addEventListener("pointerup", () => {
		if(add_annotation_mode==true &&  point_found==true){
			add_annotation_mode=false;
			controls3D.enabled = true;
			point_found=false;
		}
	} );

}