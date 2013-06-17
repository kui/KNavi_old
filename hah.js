// -*- coding:utf-8 -*-

/* 
 The MIT License

 Copyright (c) 2010 Keiichiro Ui

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
*/

var DEBUG = false;

if(typeof(HaH) != "undefined"){
  try{
    window.removeEventListener("keydown", HaH.fireHaH, true);
  }catch(e){ console.log(e); }
  try{
    window.removeEventListener("keyup", HaH.keyupHook, true);
  }catch(e){ console.log(e); }
}

var HaH = {

  ///// setting property /////
  FireKey: " ",
  HintKeys: "asdfghjkl",
  DisplayCase: "UpperCase",
  HintStyle: [
    "background-color: #000",
    "color: #fff",
    "font-size: 12pt",
    "opacity: 0.4",
    "border-radius: 2px",
    "border: 1px solid #fff",
    "padding: 0px 3px",
    "-webkit-transition: all 0.2s linear",
    "z-index: 2147483646"
  ].join(";"),
  HitCandStyle: [
    "opacity: 0.8"
  ].join(";"),
  HitStyle: [
    "background-color: #f00",
    "font-size: 144%",
    "color: #fff"
  ].join(";"),
  ///// /setting property /////

  // prefix of ID of added elements
  idPrefix: "KUI_KJump",

  // To avoid repeat of the display hints
  keydownFlag: false,

  // the number of hit
  numHit: 0,

  hintKeyMap: {},
  hintsElement: null,
  hintsList: null,
  upperCaseFlag: true,

  selectClickableElementsQuery:
  "a[href],input:not([type=hidden]),textarea,select,*[onclick],button",

  main: function(){
    D("##### main() #####");

    window.addEventListener("keydown", HaH.fireHaH, true);
    window.addEventListener("keyup", HaH.keyupHook, true);
    HaH.onLoadOptions = function(){
      HaH.addStyleSheet();
    }
    HaH.loadOptions();
    D("##### /main() #####");
  },

  loadOptions: function(){
    var callback = function(opt){
      for(var k in opt){
	HaH[k] = opt[k];
      }
      HaH.upperCaseFlag = (HaH["DisplayCase"] == "UpperCase");
      HaH.onLoadOptions();
    };
    var data = {
      to: "Background",
      from: "Content Script",
      operation: "Send Options"
    };
    chrome.extension.sendRequest(data,callback);
  },

  addStyleSheet: function(){
    var styleEl = document.createElement("style");
    styleEl.type = 'text/css';
    document.getElementsByTagName("head")[0].appendChild(styleEl);
    var content = "";

    HaH.HintStyle += ";position: absolute";
    
    var rules = [
      {selector:"span.kui_hah", style: HaH.HintStyle},
      {selector:"span.kui_hah.kui_hah_cand", style: HaH.HitCandStyle},
      {selector:"span.kui_hah.kui_hah_hit", style: HaH.HitStyle}
    ];
    var rulesLen = rules.length;
    for(var i=0; i<rulesLen; i++){
      D(rules[i]);
      content += rules[i].selector+"{"+rules[i].style+"}\n";
    }

    styleEl.textContent = content;

  },

  fireHaH: function(event){

    var key = HaH.itoc(event.keyCode);
    //HaH.printKey(event);

    if(HaH.FireKey != key || HaH.escapeFireCondition(event)){
      // not fire
      return false;
    }

    event.preventDefault();
    event.stopPropagation();
    
    if(HaH.keydownFlag) return true;
    
    HaH.keydownFlag = true;
    D("## draw hints");
    HaH.drawHints();
    
    window.addEventListener("keydown", HaH.typeHint, true);
    HaH.numHit = 0;

    return false;
  },

  // escapeFireCondition(eventObject)
  //   return true if you want to escape fire.
  //   return false if you don't.
  escapeFireCondition: function(e){
    return e.shiftKey || e.metaKey || e.altKey || e.ctrlKey ||
      HaH.isEditable(e.target);
  },

  // add hints elements
  drawHints: function(){

    if(HaH.hintsElement){
      console.error("ALLREADEY DRAW HINTS");
      return false;
    }

    var hintsEle = document.createElement("div");
    HaH.hintsElement = hintsEle;
    hintsEle.id = HaH.idPrefix+"Hints";

    var clickables = 
      document.querySelectorAll(HaH.selectClickableElementsQuery);
    var len = clickables.length;
    var hints = [];
    var df = document.createDocumentFragment();
    for(var i=0;i<len;i++){
      var e = clickables[i];
      var r = e.getClientRects()[0];
      if(r && HaH.isViewable(e,r)){
	var hintEle = HaH.drawHint(e,r);
	hints.push({
	  hintElement: hintEle,
	  targetElement: e
	});
	df.appendChild(hintEle);
      }
    }

    hintsEle.appendChild(df);
    document.body.appendChild(hintsEle);

    var hintTexts = HaH.createHintTexts(hints.length);
    for(var i=0,len=hints.length;i<len;i++){
      if(HaH.upperCaseFlag){
	hints[i].hintElement.textContent = hintTexts[i].toUpperCase();
      }else{
	hints[i].hintElement.textContent = hintTexts[i];
      }     
      HaH.addClassName(hints[i].hintElement, "kui_hah_cand");
    }

    HaH.hintsList = hints;

    return true;
  },

  // isInWindow and isNullArea is not need.
  // but these functions may be faster than isTouchalbe.
  isViewable: function(e,r){
    return HaH.isInWindow(r) && !HaH.isNullArea(r) && HaH.isTouchable(e,r);
  },

  isInWindow: function(r){
    return r.top >= 0 && r.top <= window.innerHeight &&
      r.left >= 0 && r.left <= window.innerWidth;
  },

  isNullArea: function(r){
    return r.width <= 0 && r.height <= 0;
  },

  isTouchable: function(e,r){
    var ne = document.elementFromPoint((r.left+r.right)/2, (r.top+r.bottom)/2);
    //D("=======",e,r,ne);
    return ne && (ne === e || e.contains(ne));
  },

  isEditable: function(ele){
    try{
      return ele.selectionStart != undefined ||
	ele.getAttribute("contenteditable") == "true";
    }catch(e){
      D(e);
      return false;
    }
  },

  drawHint: function(ele,rect){
    var hint = document.createElement("span");
    hint.className = "kui_hah";
    hint.style.left = (window.pageXOffset+rect.left-5)+"px";
    hint.style.top  = (window.pageYOffset+rect.top-5)+"px";
    hint.textContent = "  ";
    return hint;
  },

  createHintTexts: function(length){
    var texts = [];
    var ks = HaH.HintKeys;
    var ksLen = HaH.HintKeys.length;
    for(var j=-1;texts.length<length;j++){
      var suffix = texts[j] || [];
      for(var i=0;i<ksLen;i++){
	texts.push(ks[i]+suffix);
	if(texts.length>=length){ break; }
      }
    }
    texts.sort(HaH._sort2);
    return texts;
  },
  
  // _sort1 sort as 
  // a, s, ... , l, aa, as, ... , ll, aaa, ...
  _sort1: function(a,b){

    var s = a.length - b.length;
    if(s != 0) return s;
    
    var len = a.length;
    var ks = HaH.HintKeys;
    for(var i=0; i<len ;i++){
      var s = ks.indexOf(a[i]) - ks.indexOf(b[i])
      if(s!=0) return s;	  
    }
    return 0;

  },

  // _sort2 sort as 
  // a, aa, aaa, as, asa, ad, af, ...
  _sort2: function(a,b){

    var ks = HaH.HintKeys;
    var len = (a.length > b.length) ? a.length : b.length;
    for(var i=0; i<len ;i++){
      var s = ks.indexOf(a[i]) - ks.indexOf(b[i])
      if(s!=0) return s;	  
    }
    return a.length - b.length;

  },

  typeHint: function(event){

    var key = HaH.itoc(event.keyCode);

    if(HaH.isEscapeKey(event)){
      D("## catch escape key down event");
      HaH.removeHints();
      window.removeEventListener("keydown",HaH.typeHint,true);
      HaH.numHit = 0;
      return true;
    }else if(!HaH.isHintKey(key)){
      // not fire if not hint key
      return true;
    }

    event.preventDefault();
    event.stopPropagation();

    if(HaH.upperCaseFlag) key = key.toUpperCase();
    
    D("hit "+HaH.numHit);
    HaH.printKey(event);

    var hitEle = HaH.selectCandidates(key);

    if(hitEle){
      HaH.numHit++;
    }else{
      D("## remove typeHint listener");
      window.removeEventListener("keydown",HaH.typeHint,true);
      HaH.numHit = 0;
    }

    return true;

  },

  isEscapeKey: function(event){
    return event.keyCode == 27;
  },

  isHintKey: function(key){
    return HaH.HintKeys.indexOf(key,0) >= 0;
  },

  selectCandidates: function(key){

    var hitEle = null;

    var cands = HaH.hintsElement.getElementsByClassName("kui_hah_cand");
    var nonCands = [];
    for(var i=0,l=cands.length; i<l; i++){
      var cand = cands[i];
      if(!HaH.isCandidate(key, cand)){
	nonCands.push(cand)
      }else if(cand.textContent.length == HaH.numHit+1){
	HaH.addClassName(cand, "kui_hah_hit");
	hitEle = cand;
      }
    }

    for(var i=0,l=nonCands.length; i<l; i++){
      HaH.removeClassName(nonCands[i], "kui_hah_cand");
      HaH.removeClassName(nonCands[i], "kui_hah_hit");
    }

    return hitEle;
  },

  isCandidate: function(key, cand){
    var tar = cand.textContent[HaH.numHit];
    return tar && tar == key;
  },

  addClassName: function(ele, className){
    var regexp = new RegExp("(?:^|\s)(?:"+className+")(\s|$)");
    if(!regexp.test(ele.className)){
      ele.className += " ";
      ele.className += className;
    }
  },

  removeClassName: function(ele, className){
    ele.className = 
      ele.className.split(/\s+/).filter(function(name){
	return className != name;
      }).join(' ');
  },
  
  keyupHook: function(event){

    HaH.printKey(event);
    var key = HaH.itoc(event.keyCode);

    if(HaH.FireKey != key){
      // not fire
      return true;
    }
    
    HaH.keydownFlag = false;
    event.preventDefault();

    if(HaH.numHit != 0){
      D("## hit");
      HaH.hit(event);
      //event.preventDefault();
    }

    D("## remove hints");
    HaH.removeHints();
    
    D("## remove typeHint listener");
    window.removeEventListener("keydown",HaH.typeHint,true);

    return true;
  },

  hit: function(event){
    var ele = HaH.hintsElement.getElementsByClassName("kui_hah_hit")[0];
    var target = null;
    for(var i=0,l=HaH.hintsList.length; i<l; i++){
      if(ele === HaH.hintsList[i].hintElement){
	target = HaH.hintsList[i].targetElement;
	break;
      }
    }
    D(target);
    HaH.mouseClick(target, event);
    //HaH.openContextMenu(target, event);
  },

  mouseClick: function(target, modKeys){
    D(HaH.isEditable(target));
    if(HaH.isEditable(target)){
      target.focus();
    }else{
      var mEv = document.createEvent('MouseEvents');
      mEv.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0,
			 modKeys.ctrlKey, modKeys.altKey, modKeys.shiftKey,
			 modKeys.metaKey || modKeys.ctrlKey, 0, null);
      target.dispatchEvent(mEv);
    }
  },

  openContextMenu: function(target, modkeys){
    var mEv = document.createEvent('MouseEvents');
    mEv.initMouseEvent("contextmenu", true, true, window, 1, 0, 0, 0, 0,
		       false, false, false, false, 2, null);
    target.dispatchEvent(mEv);
    D(mEv)
  },

  removeHints: function(){

    if(!HaH.hintsElement) return true;

    document.body.removeChild(HaH.hintsElement);
    hintsList = null;
    HaH.hintsElement = null;

    return true;
  },

  // print key and option keys
  printKey: function(e){
    var s = e.type + ": "
    s += (e.ctrlKey ? "C-" : "") + (e.altKey ? "A-" : "");
    s += (e.shiftKey ? "S-" : "") + (e.metaKey ? "M-" : "");
    s += e.keyCode + " (" + String.fromCharCode(e.keyCode) + ")";
    D(s);
  },

  // keycode to char (with lower case)
  itoc: function(i){
    return String.fromCharCode(i).toLowerCase();
  }

};

var D = function(msg){

  if(!DEBUG) return;

  var args = arguments;
  var argsLen = args.length;
  for(var i=0;i<argsLen;i++){
    console.log(args[i]);
  }
};

HaH.main();
