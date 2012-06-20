importScripts("ntapi.js", "proc-info.js");
var s1, s2, s1Time, timer = null;

function procSnapshot(filter, delay){
   s1 = enumProcesses();
   s1Time = new Date();
   clearTimeout(timer);
   timer = setTimeout(procSnapshotDone, delay, filter, delay);
}

function procSnapshotDone(filter, delay){
  var ret = {};
  var s2 = enumProcesses();
  var pDelta = delta(s1, s2, (new Date() - s1Time) / 1000);
  var pSvc = enumProcServices();
  
  for (pid in pDelta){
    var p = s2[pid];
    p = merge(p, pDelta[pid]);
    if (filter && !eval(filter)) continue;
    if (pid in pSvc)
      p.Services = pSvc[pid];
    p.FileName = imageFileName(pid);
    if (p.FileName)
      p = merge(p, versionInfo(p.FileName));
    ret[pid] = p;
  }
  self.postMessage(ret);
}

function merge(a1, a2){
 for (var prop in a2) 
    if (a2.hasOwnProperty(prop)) 
      a1[prop] = a2[prop];
  return a1;
}

self.onmessage = function(event) {
  if (!windowsVersion())
    self.postMessage(null);
  else
    procSnapshot(event.data[0], event.data[1]);
}
