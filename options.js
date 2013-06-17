var DEBUG_FLAG = true;

var statusEle;
var main = function(){
  loadManifest();
  restoreOptions();
  statusEle = document.getElementById("Status");
};

var loadManifest = function(){
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/manifest.json", true);
  //xhr.onreadystatechange = function() {
  xhr.onload = function() {
    if (xhr.readyState == 4) {
      var manifest = JSON.parse(xhr.responseText);
      document.title = manifest["name"] + " Options";
      document.getElementById("Title").innerHTML = 
	manifest["name"] + " Options";
      document.getElementById("Description").innerHTML = 
	"version:" + manifest["version"] + "<br/>" + manifest["description"]
    }else{
      throw "manifest load error";
    }
  };
  xhr.send();
};

var restoreOptions = function(){
  D("# restore options");
  for(var i=0,len=optNames.length;i<len;i++){
    var name = optNames[i];
    var val = localStorage[name];
    if(!val){
      localStorage[name] = (val = defaultOptions[name]);
    }
    var ele = document.getElementById(name);
    if(ele) ele.value = val;
    //D("Name:"+name+" Val:"+val+" Ele:"+ele);
  }
};

var saveOptions = function(){
  try {
    D("# verify options");
    for(var i=0,len=optNames.length;i<len;i++){
      var name = optNames[i];
      var veri = verifyOption(name);
      if(veri != true){
	console.error("verifyOption("+name+"): "+verifyOption(name));
	D("# cannot save");
	setErrorMessage(name, veri);
	return;
      }else{
	unsetErrorMessage(name);
      }
    }
    
    D("# save options");
    for(var i=0,len=optNames.length;i<len;i++){
      var name = optNames[i];
      var val = document.getElementById(name).value;
      localStorage[name] = val;
    }

    D("# send background.html");
    var data = {
      to: "Background",
      from: "Options",
      operation: "Load Options"
    };
    var callback = function(res){
      if(res){
	D("# background may load options");
      }
    }
    chrome.extension.sendRequest(data,callback);
    statusEle.style.opacity = "0";
    statusEle.textContent = "DONE.";
    setTimeout(function(){
      statusEle.style.webkitTransition = "opacity 0.01s linear";
      statusEle.style.opacity = "1";
    },10);
    setTimeout(function(){
      statusEle.style.webkitTransition = "opacity 1s linear";
      statusEle.style.opacity = "0";
    },1000);
  }catch(e){
    statusEle.textContent = "ERROR. "+e;
    statusEle.style.webkitTransition = "opacity 0.01s linear";
    statusEle.style.opacity = "1";
  }
};

var fadeOut = function(e, sec){
  e.style.opacity = "1";
  e.style.webkitTransition = "opacity "+sec+"s linear";
  e.style.opacity = "0";
};


var verifyOption = function(name){
  try{
    var f = varifyFuncs[name];
    if(typeof(f) == "function") f();
  }catch(e){
    return e;
  }
  return true;
};

var setErrorMessage = function(name, msg){
  var msgEle = document.createElement("span");
  var ele = document.getElementById(name);
  var next = ele.nextSlibing;
  msgEle.id = "ErrMsgBox";
  msgEle.textContent = msg;
  msgEle.style.color = "#c00";
  ele.style.background = "#fcc";
  if(next){
    document.inserBefore(msgEle,next);
  }else{
    ele.parentNode.appendChild(msgEle);
  }
  statusEle.textContent = "ERROR. see above."
  statusEle.style.webkitTransition = "opacity 0.01s linear";
  statusEle.style.opacity = "1";
};

var unsetErrorMessage = function(name){
  var b = document.getElementById("ErrMsgBox");
  if(b){
    b.parentNode.removeChild(b);
    document.getElementById(name).style.background = "#fff";
  }
}

var D = function(o){
  if(DEBUG_FLAG)
    console.log(o);
};

