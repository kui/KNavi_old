var optNames = ["FireKey", "HintKeys", "DisplayCase", "HintStyle",
		"HitCandStyle", "HitStyle"];

var defaultOptions = {
  "FireKey": " ",
  "HintKeys": "asdfghkl",
  "DisplayCase": "UpperCase",
  "HintStyle": ["background-color: #000", "color: #fff", "font-size: 12pt",
		"opacity: 0.4",	"border-radius: 2px", "border: 2px solid #fff",
		"padding: 0px 3px", "-webkit-transition: all 0.08s linear",
		"z-index: 2147483646"
	       ].join(";\n"),
  "HitCandStyle": "opacity: 0.8",
  "HitStyle": ["background-color: #f00", "font-size: 144%", "color: #fff",
	       "z-index: 2147483647"
	      ].join(";\n")
};

var varifyFuncs = {
  "FireKey": function(){
    var val = document.getElementById("FireKey").value;
    if(val.length != 1){
      throw("input ONE charactar");
    }
  },
  "HintKeys": function(){
    var val = document.getElementById("HintKeys").value;
    var regexp = /[a-z0-9]/g;
    if(val.replace(regexp,"").length != 0 || val.length == 0){
      throw("input "+regexp+" charactors");
    }

    var fk = document.getElementById("FireKey").value;
    for(var i=0,len=val.length;i<len;i++){
      var c = val[i];
      for(var j=i+1;j<len;j++){
	if(c == val[j]){
	  throw("input no duplication. (two or more \""+c+"\")");
	}
      }
      if(fk == c){
	throw("cannot use fire key. (\""+c+"\" is fire key)");
      }
    }
  },
  "DisplayCase": function(){
    var val = document.getElementById("DisplayCase").value;
    if(val != "UpperCase" && val != "LowerCase"){
      throw("'UpperCase' or 'LowerCase'");
    }
  }
}