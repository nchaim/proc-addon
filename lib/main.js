const {Factory, Unknown} = require('api-utils/xpcom');
const {Cc, Ci, Cu, Cm, Cr} = require("chrome");
const pageMod = require("page-mod");
const ss = require("simple-storage");
const data = require("self").data;
const {ChromeWorker} = Cu.import("resource://gre/modules/Services.jsm");

const AboutSlowStartup = Unknown.extend({
  interfaces: ['nsIAboutModule'],    
  getURIFlags: function(aURI) { return Ci.nsIAboutModule.ALLOW_SCRIPT; },   
  newChannel: function(aURI) {  
    var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);  
    var channel = ioService.newChannel(data.url("about-slowstartup.html"), null, null);  
    var securityManager = Cc["@mozilla.org/scriptsecuritymanager;1"].getService(Ci.nsIScriptSecurityManager);
    var principal = securityManager.getSystemPrincipal(aURI);
    channel.originalURI = aURI; 
    channel.owner = principal;   
    return channel;  
  }  
});

Factory.new({component: AboutSlowStartup, contract: '@mozilla.org/network/protocol/about;1?what=slowstartup'});

const SLOW_STARTUP_TIME = 0;
const MAX_LOG_ENTRIES = 50;
var _time, _startupTime;

exports.main = function(options, callbacks) {
  if (options.loadReason != "startup") return;
  var si = Services.startup.getStartupInfo();
  _time = si.process;
  _startupTime = si.firstPaint - si.process;

  if (_startupTime >= SLOW_STARTUP_TIME){
    console.log("_startupTime >= SLOW_STARTUP_TIME");
    var worker = new ChromeWorker(data.url("proc-info-worker.js"));
    worker.onmessage = function(event) { logStartup(event.data); }
    worker.postMessage(["(p.CPU > 0.01 || p.IOCountDelta > 0 || " + 
      "p.PageFaultCountDelta > 0) && pid != 0", 1000]);
  } else {
    console.log("_startupTime < SLOW_STARTUP_TIME");
    logStartup({});
  }
};

function logStartup(data){
  if(!ss.storage.h)
    ss.storage.h = [];
  if(ss.storage.h.length >= MAX_LOG_ENTRIES)
    ss.storage.h.shift();
  ss.storage.h.push({
    'time': _time, 'startupTime': _startupTime, 'data': data
  });
  activatePageMod();
}

var pMod = null;
function activatePageMod(){
  if (pMod) pMod.destroy();
  pMod = pageMod.PageMod({
    include: ['about:slowstartup'],
    contentScript: "document.defaultView.postMessage(" + 
      JSON.stringify(ss.storage.h) + ", '*');",
    contentScriptWhen: 'end',
    /*onAttach: function(worker) {
      console.log("====WORKER");
    }*/
  });
}
activatePageMod();
