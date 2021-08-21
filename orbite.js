var canvas = document.getElementById("renderCanvas");
var engine = null;
var scene = null;
var sceneToRender = null;
var createDefaultEngine = function() { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false}); };
var createScene = function () {    
var scene = new BABYLON.Scene(engine);	
var camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 1, Math.PI / 2,200, BABYLON.Vector3.Zero(), scene);
camera.lowerRadiusLimit = 10;
camera.upperRadiusLimit = 500;
camera.attachControl(canvas, true);	
var light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(-1, 0, 0), scene);
let DOM = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
let textlog = new BABYLON.GUI.TextBlock("console");DOM.addControl(textlog);textlog.text = "";textlog.color="#fff";textlog.width = '100%';textlog.height = '10%';textlog.horizontalAlignment  = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;textlog.verticalAlignment    = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;textlog.resizeToFit = true;
let print = function(v){textlog.text = v.toString();} 
scene.clearColor = bC3(0.0, 0.0, 0.0);
//material
let satMat = new BABYLON.StandardMaterial('texture satellite', scene);
satMat.specularPower = 0;
satMat.diffuseColor = new BABYLON.Color3(1.00, 0.00, 0.00);
satMat.emissiveColor = new BABYLON.Color3(1.00, 0.00, 0.00);
satMat.specularColor = new BABYLON.Color3(0.00, 0.00, 0.00);
//Functions BABYLON raccourcies
function bC3(r,g,b){r=(!r)?0:r;g=(!g)?0:g;b=(!b)?0:b;return new BABYLON.Color3(r,g,b);}
function bV3(x,y,z){x=(!x)?0:x;y=(!y)?0:y;z=(!z)?0:z;return new BABYLON.Vector3(x, y, z)}
function bV3dist( a, b ){return BABYLON.Vector3.Distance(a, b);}
function inBound(v,a,b){if (a>b){let s = a; a = b; b = s;}return (v>=a && v<=b);}
function among(v,a,b){if (a>b){let s = a; a = b; b = s;}return (v<a)?a:(v>b?b:v);}
function floor(a,n){n = (!n)?1:n;return Math.floor(a*n)/n;}
function intToText(value){
    let txt = value.toString(),cpt =0,out="";
    for(let i=(txt.length-1);i>=0;i--){
        cpt++;if (cpt>3){cpt =0;out = "."+out;}            
        out = txt[i]+out;
    }return out;
}

//FUNCTION ORBITALE

let orbit = function(p0,v0,Dt,mass){
    const G = 6.67e-11;
    let R = Math.sqrt(p0.x**2 + p0.y**2 + p0.z**2),
        a  = G * mass / (R**2),
        alpha = Math.abs(Math.atan(p0.y/p0.x)),
        beta  = Math.abs(Math.asin(p0.z/R)), 
        acc = bV3(
            (!p0.x?0:a) * Math.cos(beta) * Math.cos(alpha),
            (!p0.y?0:a) * Math.cos(beta) * Math.sin(alpha),
            (!p0.z?0:a) * Math.sin(beta)
        ).multiply(bV3((p0.x > 0 ? -1:1),(p0.y > 0 ? -1:1),(p0.z > 0 ? -1:1)));
    return {
        position : bV3(
            p0.x + (v0.x * Dt) + (acc.x * Dt**2) ,// / 2,
            p0.y + (v0.y * Dt) + (acc.y * Dt**2) ,// / 2,
            p0.z + (v0.z * Dt) + (acc.z * Dt**2) // / 2
        ),
        speed : bV3(
            v0.x + acc.x * Dt,
            v0.y + acc.y * Dt,
            v0.z + acc.z * Dt
        ),
        angle : {
            a: Math.atan2(p0.y, p0.x),
            b: Math.atan2(p0.z, p0.x),
        }
    };
}
//PARAMETRES
//Changer les valeurs ici 
//(Attention à bien corréler la distance entre la distance orbitale max, et le rayon astral)
let po = bV3( -10e6 , -10e6 , 0); //position de départ
let vt = bV3( 1500,  -3500,-5200); //vitesse de départ 2
//Donnée temporelle : 1 = temps rectiligne uniformément varié
const Dt = 1; //temps laisser en mouvement rectiligne
const masse_astre = 6e24;  // masse de l'astre en kg (influe directement sur la gravité/force de pesanteur)
const speed = 100;      //accélération du temps (2 : 1 sec dans la simulation = 2 sec IRL)
const ligne = true;     //afficher la trajectoire
const ligneMax = 0;   // taille de la trajectoire enregistrée (sa trainée) 0 = infini !
const distance_Maximum_orbite = 1000;        // 300e6 metres
const distance_Minimum_orbite = 6.378137;   //rayon astre *1e6
//variable de rendu de scene
const sizeDivisor = bV3(1e6,1e6,1e6),lineSize = 1000,createNewLineTime = 100;
let orbitTimer = Date.now(),lines = [],points = [],cpt = 0,
    alpha = 0,delta = 0,ang = false,checkTurn = 0,turn = 0,
    time = 0, security = po.divide(sizeDivisor),onetime = false, txtTime = 0;
//objects 3d
let satellite = BABYLON.Mesh.CreateCapsule("capsule", {radius:0.25, capSubdivisions: 6, subdivisions:6, tessellation:36, height:1.5, orientation:BABYLON.Vector3.Forward()});
satellite.position = security;
satellite.material = satMat;

let astre = BABYLON.Mesh.CreateSphere("Astre", 16, distance_Minimum_orbite*2 , scene);
astre.material = new BABYLON.StandardMaterial("astreMat", scene);
astre.material.diffuseTexture = new BABYLON.Texture("textures/terre.png", scene);
// Axe X = Rouge
// Axe Y = Bleu
// Axe Z = Vert
// 4444.1111.2222.3333.4444.5555.6666.7777
let lX = BABYLON.Mesh.CreateLines("lx", [bV3(-1e3,0,0),bV3(1e3,0,0)] , scene);lX.color = bC3(1,0,0);
let lY = BABYLON.Mesh.CreateLines("ly", [bV3(0,-1e3,0),bV3(0,1e3,0)] , scene);lY.color = bC3(0,1,0);
let lZ = BABYLON.Mesh.CreateLines("lz", [bV3(0,0,-1e3),bV3(0,0,1e3)] , scene);lZ.color = bC3(0,1,1);
//boucle du rendu de la scene
scene.registerBeforeRender(function () {
    let dist = bV3dist(bV3(0,0,0),security)
    if (inBound(dist,distance_Minimum_orbite,distance_Maximum_orbite)){
        for ( var i = 0; i < speed; i++ ){
            let rst = orbit(po,vt,Dt,masse_astre);
            po = rst.position;
            vt = rst.speed; 
            if (!ang){
                ang = true;
                alpha = rst.angle.a;
                delta = rst.angle.b;
            }else{
                if (
                    checkTurn <= Date.now() &&
                    inBound(rst.angle.a,alpha-0.01,alpha+0.01) && 
                    inBound(rst.angle.b,delta-0.01,delta+0.01)
                ){
                    checkTurn = Date.now()+500;
                    turn++;
                }
            }
        }
        security = po.divide(sizeDivisor);
        satellite.position = security;
        if (ligne){
            if (!points[cpt]){points[cpt]=[];}
            if (points[cpt].length<lineSize){
                points[cpt].push(security);
            }else{
                cpt++;
                points[cpt]=[];
                points[cpt].push(security);
                if (points[cpt-1]){
                    points[cpt-1].push(security);
                    if (lines[cpt-1]){lines[cpt-1].dispose();}
                    lines[cpt-1] = BABYLON.Mesh.CreateLines("line"+(cpt-1), points[cpt-1] , scene);
                }
                if (ligneMax>0){
                    if (lines.length>=ligneMax){
                        if (lines[lines.length-ligneMax]){lines[lines.length-ligneMax].dispose();}
                        if (points[lines.length-ligneMax]){points[lines.length-ligneMax]=true;}
                    }
                    let step = 1.0/ligneMax,color= 1.0;
                    for ( var i = 1; i <= ligneMax; i++ ){
                        if (lines[lines.length-i]){
                            color = among(color-step,0,1);
                            lines[lines.length-i].color = bC3(color,color/2,0);
                        }
                    }
                }
            }
            if (time<=Date.now()){
                time=Date.now()+createNewLineTime;
                if (points[cpt]){
                    if (lines[cpt]){lines[cpt].dispose();}
                    lines[cpt] = BABYLON.Mesh.CreateLines("line"+(cpt), points[cpt] , scene);
                    lines[cpt].color = bC3(1,0.8,0);
                }
            }
            if (txtTime<=Date.now()){
                txtTime= Date.now()+25;
                let vite = bV3dist(bV3(0,0,0),vt);
                setTimeout(function() {
                    print(
                    "\n\nDistance : "+ intToText(floor(dist*1e3)) + " km"+
                    "\nVitesse : "+ intToText(floor(vite)) + " m/s"+
                    "\nItérations : "+turn
                );
                },0)
            }
        }
    }else{
        if (!onetime){
            onetime= true;
            let vite = bV3dist(bV3(0,0,0),vt);
            print(
                "\n\nDistance: "+ intToText(floor(dist*1e3)) +" km"+
                "\nVitesse: "+ intToText(floor(vite)) + " m/s"+
                "\nTour: "+turn+"\n"+
                ((dist <= distance_Maximum_orbite)?"CRASH":"PERIAPS TO FAR")+
                "\n orbite time: "+((Date.now()-orbitTimer)/speed)
            );
        }
    }
});
return scene;
}
// Projet Simulation orbitale par rapport à un corps stellaire, Haroun & Dorian.
// Partie Babylon
                window.initFunction = async function() {
                    
                    var asyncEngineCreation = async function() {
                        try {
                        return createDefaultEngine();
                        } catch(e) {
                        console.log("the available createEngine function failed. Creating the default engine instead");
                        return createDefaultEngine();
                        }
                    }
                    window.engine = await asyncEngineCreation();
        if (!engine) throw 'engine should not be null.';
        window.scene = createScene();};
        initFunction().then(() => {sceneToRender = scene        
            engine.runRenderLoop(function () {
                if (sceneToRender && sceneToRender.activeCamera) {
                    sceneToRender.render();
                }
            });
        });
        // Resize
        window.addEventListener("resize", function () {
            engine.resize();
        });