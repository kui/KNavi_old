var DEBUG_FLAG = true;
var HaHOptions = {};

var main = function(){
  D("# main");
  loadOptions();
  chrome.extension.onRequest.addListener(receiver);
  D("# /main");
};

var receiver = function(req, sender, sendRes) {

  if(req.to != "Background"){
    return;
  }

  if(req.from == "Options"){
    D("# request from option page");

    if(req.operation == "Load Options"){
      D("# load options");
      loadOptions();
      sendRes(true);
    }else{
      sendRes(false);
    }

  }else if(req.from == "Content Script"){
    D("# request from content script");

    if(req.operation == "Send Options"){
      D("# send options to content script")
      sendRes(HaHOptions);
    }else{
      sendRes({});
    }

  }else{
    sendRes(false);
    throw "#unknown sender";
  }
};

var loadOptions = function(){
  for(var i=0,len=optNames.length;i<len;i++){
    var name = optNames[i];
    HaHOptions[name] = localStorage[name] || defaultOptions[name];
  }
  D(HaHOptions);
};

var D = function(o){
  if(DEBUG_FLAG)
    console.log(o);
};

//main();
