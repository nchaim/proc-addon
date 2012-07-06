const {Factory, Unknown} = require('api-utils/xpcom');
const {Cc, Ci, Cu, Cm, Cr} = require("chrome");
const pageMod = require("page-mod");
const ss = require("simple-storage");
const data = require("self").data;
const prefService = require("preferences-service");
const {ChromeWorker, Services} = Cu.import("resource://gre/modules/Services.jsm");

const AboutComponent = Unknown.extend({
  interfaces: ['nsIAboutModule'],    
  getURIFlags: function(aURI) { return Ci.nsIAboutModule.ALLOW_SCRIPT; },   
  newChannel: function(aURI) {  
    const urlMap = {'':'about-slowstartup.html', 'simple':'simple-log.html'};
    var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    var qs = aURI.path.split("?")[1] || "";
    var file = urlMap[qs] || urlMap[''];
    var channel = ioService.newChannel(data.url(file), null, null);  
    var securityManager = Cc["@mozilla.org/scriptsecuritymanager;1"].getService(Ci.nsIScriptSecurityManager);
    var principal = securityManager.getSystemPrincipal(aURI);
    channel.originalURI = aURI; 
    channel.owner = principal;   
    return channel;  
  }
});

Factory.new({component: AboutComponent, contract: '@mozilla.org/network/protocol/about;1?what=slowstartup'});

const SLOW_STARTUP_MIN_TIME = 12000;
const MAX_LOG_ENTRIES = 50;
const PREF_NAME = "extensions.slowstartup";
const DEFAULT_SERVER_URL = "http://telemetry.allizom.org/cgi-bin/slowstartup/log.php";
var _time, _startupTime, ready = false;

exports.main = function(options, callbacks) {
  if (options.loadReason != "startup") {ready = true; return;}
  var si = Services.startup.getStartupInfo();
  var interrupted = Services.startup.interrupted;
  _time = si.process;
  _startupTime = si.firstPaint - si.process;

  if (_startupTime >= SLOW_STARTUP_MIN_TIME && !interrupted){
    var worker = new ChromeWorker(data.url("proc-info-worker.js"));
    worker.onmessage = function(event) { logStartup(event.data); };
    worker.postMessage(JSON.stringify(["(p.CPU > 0.05 || p.IOTransferDelta > 512*1024 || " + 
      "p.PageFaultCountDelta > 256 || p.CurrentProcess) && pid != 0", 5000]));
  } else {
    logStartup(null);
  }
};

function logStartup(data){
  if(ss.storage.h.length >= MAX_LOG_ENTRIES)
    ss.storage.h.shift();
  var log = {'time': _time, 'startupTime': _startupTime, 'data': data};
  ss.storage.h.push(log);
  if (lastWorker) lastWorker.postMessage(JSON.stringify(ss.storage.h));
  ready = true;
  if (!data) return;
  
  var TelemetryPing = Cc["@mozilla.org/base/telemetry-ping;1"].getService(Ci.nsIObserver);
  var str = Cc['@mozilla.org/supports-string;1'].createInstance(Ci.nsISupportsString);
  TelemetryPing.observe(str, "get-payload", "");
  log = {'time': _time, 'startupTime': _startupTime, 'data': data, 
    'user_id': ss.storage.userID,'telemetry' : JSON.parse(str.data)};
  var payload = gzipCompressString(JSON.stringify(log));
  send(payload);
}

function gzipCompressString(string) {
  let observer = {
    buffer: "",
    onStreamComplete: function(loader, context, status, length, result) {
      this.buffer = String.fromCharCode.apply(this, result);
    }
  };
  let scs = Cc["@mozilla.org/streamConverters;1"]
            .getService(Ci.nsIStreamConverterService);
  let listener = Cc["@mozilla.org/network/stream-loader;1"]
                .createInstance(Ci.nsIStreamLoader);
  listener.init(observer);
  let converter = scs.asyncConvertData("uncompressed", "gzip", listener, null);
  
  var uniconv = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]  
    .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);  
  uniconv.charset = "UTF-8";
  var stream = uniconv.convertToInputStream(string);
  var size = {};
  uniconv.convertToByteArray(string, size);

  converter.onStartRequest(null, null);
  converter.onDataAvailable(null, null, stream, 0, size.value);
  converter.onStopRequest(null, null, null);
  return observer.buffer;
}

function send(data){
    let url = prefService.get(PREF_NAME+"serverURL", DEFAULT_SERVER_URL);
    let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
                  .createInstance(Ci.nsIXMLHttpRequest);
    request.mozBackgroundRequest = true;
    request.open("POST", url, true);
    request.overrideMimeType("text/plain");
    request.setRequestHeader("Content-Type", "application/json; charset=UTF-8");    
    request.setRequestHeader("Content-Encoding", "gzip");
    request.onload = function(event) {
      if (request.responseText) console.log(request.responseText);
    };
    let payloadStream = Cc["@mozilla.org/io/string-input-stream;1"]
                        .createInstance(Ci.nsIStringInputStream);
    payloadStream.data = data;
    request.send(payloadStream);
}

function uniqueID(){
  return Math.floor(Math.random() * Math.pow(2, 48));
}

var pMod = null, lastWorker = null;
if(!ss.storage.h) 
  ss.storage.h = [];
if (!ss.storage.userID) 
  ss.storage.userID = uniqueID();    

pMod = pageMod.PageMod({
  include: ['about:slowstartup*'],
  contentScript: 
    'self.on("message", function(m) { document.defaultView.postMessage(m, "*"); });',
  contentScriptWhen: 'end',
  onAttach: function(worker) {
    lastWorker = worker;
    if (ready) worker.postMessage(JSON.stringify(ss.storage.h));
  }
});
