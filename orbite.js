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