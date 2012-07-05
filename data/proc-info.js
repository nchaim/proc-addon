var _devPrefixes = null;
var _winVer = null;
var _pPID = null;
var _enumBufSize = null;

function enumProcesses(){
  var res = {};
  if (!_enumBufSize || _enumBufSize.value > 0x20000)
    _enumBufSize = new ctypes.unsigned_long(0x4000);
  var buffer = ctypes.char.array(_enumBufSize.value)();
  while(true){
    var status = NtQuerySystemInformation(SystemProcessInformation, buffer, 
      _enumBufSize, _enumBufSize.address());  
    if (status == STATUS_BUFFER_TOO_SMALL || status == STATUS_INFO_LENGTH_MISMATCH) {
      buffer = ctypes.char.array(_enumBufSize.value)();   
    } else break;
  }
  if (status < 0) return null;
  var i = 0;
  var time = new Date().getTime();
  var processor = getProcessorCounters();
  while(true){
    var proc = ctypes.cast(buffer.addressOfElement(i), SYSTEM_PROCESS_INFORMATION.ptr).contents;
    pid = cValConv(proc.UniqueProcessId);
    var pinfo = cValConv(proc);
    pinfo.IOCount = pinfo.ReadOperationCount + pinfo.WriteOperationCount + pinfo.OtherOperationCount;
    pinfo.IOTransfer = pinfo.ReadTransferCount + pinfo.WriteTransferCount + pinfo.OtherTransferCount;
    if (pid == SYSTEM_IDLE_PROCESS_ID) 
      pinfo.KernelTime = processor.IdleTime;
    pinfo.CPUTime = pinfo.UserTime + pinfo.KernelTime;
    pinfo.CurrentProcess = (curPID() == pid) || (pinfo.InheritedFromUniqueProcessId == curPID());
    pinfo.Uptime = (time-(pinfo.CreateTime-116444736000000000)/10000).toFixed();
    res[pid] = pinfo;
    if (proc.NextEntryOffset == 0) break; 
    i += parseInt(proc.NextEntryOffset);
  }
  var pi = cValConv(new SYSTEM_PROCESS_INFORMATION());
  pi.CPUTime = pi.KernelTime = (processor.InterruptTime + processor.DpcTime);
  pi.IOCount = pi.IOTransfer = pi.Uptime = 0; pi.CurrentProcess = false;
  pi.UniqueProcessId = -1; pi.ImageName = "Interrupts"; res[-1] = pi;
  _devPrefixes = null;
  return res;
}

function windowsVersion(){
  var info = new OSVERSIONINFO();
  info.dwOSVersionInfoSize = OSVERSIONINFO.size;
  var status = GetVersionExW(info.address());   
  if (status == 0) return null;
  return parseFloat(info.dwMajorVersion+"."+info.dwMinorVersion);
}

function hImageFileName60(pid){
  var strBuf = ctypes.jschar.array(MAX_PATH)();
  var info = SYSTEM_PROCESS_ID_INFORMATION(pid, UNICODE_STRING(0, MAX_PATH, strBuf));
  var status = NtQuerySystemInformation(SystemProcessIdInformation, info.address(), 
    SYSTEM_PROCESS_ID_INFORMATION.size, null);  
  if (status < 0) return null;
  return cValConv(info.ImageName);
}

function hImageFileName50(pid){
  var strBuf = ctypes.jschar.array(MAX_PATH)();
  var handle = OpenProcess(PROCESS_QUERY_INFORMATION, false, pid);
  var status = GetProcessImageFileNameW(handle, strBuf, MAX_PATH);
  CloseHandle(handle);
  if (status == 0) return null;
  return cValConv(strBuf); 
}

function imageFileName(pid){
  pid = parseInt(pid);
  if (!_winVer) _winVer = windowsVersion();
  var fn = (_winVer < 6.0) ? hImageFileName50(pid) : hImageFileName60(pid);
  if (typeof fn == "string") fn = ntToDosName(fn);
  return fn;
}

function ntToDosName(name){
   if(!_devPrefixes) _devPrefixes = devicePrefixes();
   name = name.replace(/^\\\?\\(UNC\\)?/i, "");
   for(var pfx in _devPrefixes){
     if (name.indexOf(pfx) ==  0)
      {name = name.replace(pfx, _devPrefixes[pfx]); break;}
   }
   return name;
}

function devicePrefixes(){
  var res = {"\\Device\\Mup": "\\"};
  var drives = GetLogicalDrives();
  var buffer = ctypes.jschar.array(0x100)();
  for(var i = 0, b = 1; i < 26; i++, b <<= 1){
    if (!(drives & b)) continue;
    var drv = String.fromCharCode(65+i) + ":";
    var drvW = ctypes.jschar.array()(drv);
    var ret = QueryDosDeviceW(drvW, buffer, 0x100);
    if (ret) res[buffer.readString()] = drv;
  }
  return res;
}

function versionInfo(fname){
  var verStrs = ["CompanyName", "FileDescription", "FileVersion", "InternalName", 
    "LegalCopyright", "OriginalFilename", "ProductName", "ProductVersion"];
  if(!fname || fname.match(/^\\\\/)) return null;
  var zero =  new ctypes.uint32_t();
  var fnameW = ctypes.jschar.array()(fname);
  var len = GetFileVersionInfoSizeW(fnameW, zero.address());
  if(!len) return null;
  var buffer = ctypes.char.array(len)();
  var ret = GetFileVersionInfoW(fnameW,  0, len, buffer);
  if (!ret) return null;
  var ptrans = verInfoValue(buffer, "\\VarFileInfo\\Translation");
  var trans = ctypes.cast(ptrans, LANGANDCODEPAGE.ptr).contents;
  var fInfoStr = "\\StringFileInfo\\" + dec2hex(trans.wLanguage, 4) + 
    dec2hex(trans.wCodePage, 4) + "\\";
  var res = {};
  for(var i in verStrs) {
    var rv = verInfoValue(buffer, fInfoStr+verStrs[i]);
    if (rv) res[verStrs[i]] = rv;
  }
  return res;
}

function verInfoValue(pblock, bstr){
  var verStr = ctypes.jschar.array()(bstr);
  var blen = ctypes.unsigned_int();
  var pbuf = new ctypes.voidptr_t();
  var res = VerQueryValueW(pblock, verStr, pbuf.address(), blen.address());
  if (!res || blen.value == 0) return null;
  if (bstr.match(/^\\StringFileInfo/)) 
    return ctypes.cast(pbuf, ctypes.jschar.ptr).readString();
  else return pbuf;
}

function enumProcServices(){
  var handle = OpenSCManagerW(null, null, SC_MANAGER_CONNECT | SC_MANAGER_ENUMERATE_SERVICE);
  if (!handle) return null;
  var bufferSize = new ctypes.uint32_t(0);
  var numSvc = new ctypes.uint32_t(0);

  var res = EnumServicesStatusExW(handle, SC_ENUM_PROCESS_INFO, SERVICE_WIN32, 
    SERVICE_ACTIVE, null, 0, bufferSize.address(), numSvc.address(), null, null);
  var buffer = ctypes.char.array(bufferSize.value)();  
  res = EnumServicesStatusExW(handle, SC_ENUM_PROCESS_INFO, SERVICE_WIN32, 
    SERVICE_ACTIVE, buffer, bufferSize, bufferSize.address(), numSvc.address(), null, null);
  CloseServiceHandle(handle);
  if (!res) return null; 
  var svcs = ctypes.cast(buffer, ENUM_SERVICE_STATUS_PROCESS.array(numSvc.value));
  var res = {};
  for(var i = 0; i < svcs.length; i++){
    var svc = svcs[i];
    var pid = parseInt(svc.ServiceStatusProcess.dwProcessId.toString());
    if(pid == 0) continue;
    if (!(pid in res)) res[pid] = [];
    res[pid].push({
      'Name': cValConv(svc.lpServiceName), 
      'DisplayName': cValConv(svc.lpDisplayName)
      }); 
  }
  return res;
}

function getProcessorCounters(){
  var res = {};
  var numProcessors = getBasicInfo().NumberOfProcessors;
  var buffer = SYSTEM_PROCESSOR_PERFORMANCE_INFORMATION.array(numProcessors)();
  var status = NtQuerySystemInformation(SystemProcessorPerformanceInformation, buffer, 
    SYSTEM_PROCESSOR_PERFORMANCE_INFORMATION.size*numProcessors, null);  
  if (status < 0) return null;
  for(var pn in buffer[0]){
    res[pn] = 0;
    for(var i = 0; i < numProcessors; i++)
      res[pn] += parseInt(buffer[i][pn]);
  }
  return res;
}

function getBasicInfo(){
  var sysInfo = new SYSTEM_BASIC_INFORMATION();
  var status = NtQuerySystemInformation(SystemBasicInformation, sysInfo.address(), 
    SYSTEM_BASIC_INFORMATION.size, null);  
  if (status < 0) return null;
  return cValConv(sysInfo);
}

function getPerformanceInfo(){
  perfInfo = new SYSTEM_PERFORMANCE_INFORMATION();
  var status = NtQuerySystemInformation(SystemPerformanceInformation, perfInfo.address(), 
    SYSTEM_PERFORMANCE_INFORMATION.size, null);  
  if (status < 0) return null;
  return cValConv(perfInfo);
}

function curPID(){
  if (!_pPID) _pPID = GetCurrentProcessId();
  return _pPID;
}

function cValConv(v){
  if (v == null) return null;
  if (typeof v == "number") return v;
  if (v instanceof ctypes.jschar.ptr || v instanceof ctypes.char.ptr) 
    return v.isNull() ? "" : v.readString();
  if (v instanceof UNICODE_STRING) 
    return v.Buffer.isNull() ? "" : v.Buffer.readString(); 
  if (v instanceof ctypes.UInt64 || v instanceof ctypes.Int64) 
    return parseInt(v);
  var constr = v.constructor.toString();
  if (constr.match(/\*$/)) return v.toString().match(/0x[0-9a-f]+/i)[0];
  if (constr.match(/(char|jschar)\[\d+\]$/)) return v.readString();
  if (constr.match(/\[\d+\]$/) && typeof v.length != 'undefined') {
    var arr = [];
    for(var i = 0; i < v.length; i++) arr[i] = cValConv(v[i]);
    return arr;
  }
  var obj = {}, prop = null;
  for(prop in v) obj[prop] = cValConv(v[prop]);
  if (prop != null) return obj;
  return v.toString();
}

function dec2hex(num, w){
  return (Array(w).join("0") + num.toString(16)).substr(-w);
}

function delta(s1, s2, time){
  var res = {};
	var totCPUTime = 0;
	var deltaList = ["UserTime", "KernelTime", "PageFaultCount", "HardFaultCount", "ReadOperationCount", 
	"WriteOperationCount", "OtherOperationCount", "ReadTransferCount", "WriteTransferCount", "OtherTransferCount", 
	 "IOCount", "IOTransfer", "CPUTime", "WorkingSetPrivateSize"];
	for(var pid in s1){
	  if (!(pid in s2)) continue;
	  res[pid] = {};
	  for(var i in deltaList) {
	    var p = deltaList[i];
	    res[pid][p+"Delta"] = (s2[pid][p] - s1[pid][p]) / time;
	  }
	  totCPUTime += res[pid]["CPUTimeDelta"];
	} 
	for(var pid in res)
    res[pid]["CPU"] = res[pid]["CPUTimeDelta"] / totCPUTime;  
	return res;
}
