const {Factory, Unknown} = require('api-utils/xpcom');
const {Cc, Ci, Cu, Cm, Cr} = require("chrome");
var data = require("self").data;

const AboutProc = Unknown.extend({
  interfaces: ['nsIAboutModule'],    
  getURIFlags: function(aURI) { return Ci.nsIAboutModule.ALLOW_SCRIPT; },   
  newChannel: function(aURI) {  
    var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);  
    var channel = ioService.newChannel(data.url("list.html"), null, null);  
    var securityManager = Cc["@mozilla.org/scriptsecuritymanager;1"].getService(Ci.nsIScriptSecurityManager);
    var principal = securityManager.getSystemPrincipal(aURI);
    channel.originalURI = aURI; 
    channel.owner = principal;   
    return channel;  
  }  
});

Factory.new({component: AboutProc, contract: '@mozilla.org/network/protocol/about;1?what=proc'});
