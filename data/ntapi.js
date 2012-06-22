if(typeof ctypes == "undefined")
  Components.utils.import("resource://gre/modules/ctypes.jsm"); 

const lib_ntdll = ctypes.open("ntdll.dll");
const lib_psapi = ctypes.open("psapi.dll");
const lib_kernel32 = ctypes.open("kernel32.dll");
const lib_advapi32 = ctypes.open("advapi32.dll");
const lib_versiondll = ctypes.open("version.dll");

const SYSTEM_PERFORMANCE_INFORMATION = new ctypes.StructType("SYSTEM_PERFORMANCE_INFORMATION", [
  {'IdleProcessTime': ctypes.long_long},
  {'IoReadTransferCount': ctypes.long_long},
  {'IoWriteTransferCount': ctypes.long_long},
  {'IoOtherTransferCount': ctypes.long_long},
  {'IoReadOperationCount': ctypes.unsigned_long},
  {'IoWriteOperationCount': ctypes.unsigned_long},
  {'IoOtherOperationCount': ctypes.unsigned_long},
  {'AvailablePages': ctypes.unsigned_long},
  {'CommittedPages': ctypes.unsigned_long},
  {'CommitLimit': ctypes.unsigned_long},
  {'PeakCommitment': ctypes.unsigned_long},
  {'PageFaultCount': ctypes.unsigned_long},
  {'CopyOnWriteCount': ctypes.unsigned_long},
  {'TransitionCount': ctypes.unsigned_long},
  {'CacheTransitionCount': ctypes.unsigned_long},
  {'DemandZeroCount': ctypes.unsigned_long},
  {'PageReadCount': ctypes.unsigned_long},
  {'PageReadIoCount': ctypes.unsigned_long},
  {'CacheReadCount': ctypes.unsigned_long},
  {'CacheIoCount': ctypes.unsigned_long},
  {'DirtyPagesWriteCount': ctypes.unsigned_long},
  {'DirtyWriteIoCount': ctypes.unsigned_long},
  {'MappedPagesWriteCount': ctypes.unsigned_long},
  {'MappedWriteIoCount': ctypes.unsigned_long},
  {'PagedPoolPages': ctypes.unsigned_long},
  {'NonPagedPoolPages': ctypes.unsigned_long},
  {'PagedPoolAllocs': ctypes.unsigned_long},
  {'PagedPoolFrees': ctypes.unsigned_long},
  {'NonPagedPoolAllocs': ctypes.unsigned_long},
  {'NonPagedPoolFrees': ctypes.unsigned_long},
  {'FreeSystemPtes': ctypes.unsigned_long},
  {'ResidentSystemCodePage': ctypes.unsigned_long},
  {'TotalSystemDriverPages': ctypes.unsigned_long},
  {'TotalSystemCodePages': ctypes.unsigned_long},
  {'NonPagedPoolLookasideHits': ctypes.unsigned_long},
  {'PagedPoolLookasideHits': ctypes.unsigned_long},
  {'AvailablePagedPoolPages': ctypes.unsigned_long},
  {'ResidentSystemCachePage': ctypes.unsigned_long},
  {'ResidentPagedPoolPage': ctypes.unsigned_long},
  {'ResidentSystemDriverPage': ctypes.unsigned_long},
  {'CcFastReadNoWait': ctypes.unsigned_long},
  {'CcFastReadWait': ctypes.unsigned_long},
  {'CcFastReadResourceMiss': ctypes.unsigned_long},
  {'CcFastReadNotPossible': ctypes.unsigned_long},
  {'CcFastMdlReadNoWait': ctypes.unsigned_long},
  {'CcFastMdlReadWait': ctypes.unsigned_long},
  {'CcFastMdlReadResourceMiss': ctypes.unsigned_long},
  {'CcFastMdlReadNotPossible': ctypes.unsigned_long},
  {'CcMapDataNoWait': ctypes.unsigned_long},
  {'CcMapDataWait': ctypes.unsigned_long},
  {'CcMapDataNoWaitMiss': ctypes.unsigned_long},
  {'CcMapDataWaitMiss': ctypes.unsigned_long},
  {'CcPinMappedDataCount': ctypes.unsigned_long},
  {'CcPinReadNoWait': ctypes.unsigned_long},
  {'CcPinReadWait': ctypes.unsigned_long},
  {'CcPinReadNoWaitMiss': ctypes.unsigned_long},
  {'CcPinReadWaitMiss': ctypes.unsigned_long},
  {'CcCopyReadNoWait': ctypes.unsigned_long},
  {'CcCopyReadWait': ctypes.unsigned_long},
  {'CcCopyReadNoWaitMiss': ctypes.unsigned_long},
  {'CcCopyReadWaitMiss': ctypes.unsigned_long},
  {'CcMdlReadNoWait': ctypes.unsigned_long},
  {'CcMdlReadWait': ctypes.unsigned_long},
  {'CcMdlReadNoWaitMiss': ctypes.unsigned_long},
  {'CcMdlReadWaitMiss': ctypes.unsigned_long},
  {'CcReadAheadIos': ctypes.unsigned_long},
  {'CcLazyWriteIos': ctypes.unsigned_long},
  {'CcLazyWritePages': ctypes.unsigned_long},
  {'CcDataFlushes': ctypes.unsigned_long},
  {'CcDataPages': ctypes.unsigned_long},
  {'ContextSwitches': ctypes.unsigned_long},
  {'FirstLevelTbFills': ctypes.unsigned_long},
  {'SecondLevelTbFills': ctypes.unsigned_long},
  {'SystemCalls': ctypes.unsigned_long},
  {'reserved': ctypes.uint8_t.array(16)}]);

const UNICODE_STRING = new ctypes.StructType("UNICODE_STRING", [
  {'Length': ctypes.unsigned_short},
  {'MaximumLength': ctypes.unsigned_short},
  {'Buffer': ctypes.jschar.ptr} ]);

const SYSTEM_PROCESS_INFORMATION = new ctypes.StructType("SYSTEM_PROCESS_INFORMATION", [
  {'NextEntryOffset': ctypes.unsigned_long},
  {'NumberOfThreads': ctypes.unsigned_long},
  {'WorkingSetPrivateSize': ctypes.long_long},
  {'HardFaultCount': ctypes.unsigned_long},
  {'NumberOfThreadsHighWatermark': ctypes.unsigned_long},
  {'CycleTime': ctypes.unsigned_long_long},
  {'CreateTime': ctypes.long_long},
  {'UserTime': ctypes.long_long},
  {'KernelTime': ctypes.long_long},
  {'ImageName': UNICODE_STRING},
  {'BasePriority': ctypes.long},
  {'UniqueProcessId': ctypes.unsigned_long},
  {'InheritedFromUniqueProcessId': ctypes.unsigned_long},
  {'HandleCount': ctypes.unsigned_long},
  {'SessionId': ctypes.unsigned_long},
  {'UniqueProcessKey': ctypes.unsigned_long},
  {'PeakVirtualSize': ctypes.size_t},
  {'VirtualSize': ctypes.size_t},
  {'PageFaultCount': ctypes.unsigned_long},
  {'PeakWorkingSetSize': ctypes.size_t},
  {'WorkingSetSize': ctypes.size_t},
  {'QuotaPeakPagedPoolUsage': ctypes.size_t},
  {'QuotaPagedPoolUsage': ctypes.size_t},
  {'QuotaPeakNonPagedPoolUsage': ctypes.size_t},
  {'QuotaNonPagedPoolUsage': ctypes.size_t},
  {'PagefileUsage': ctypes.size_t},
  {'PeakPagefileUsage': ctypes.size_t},
  {'PrivatePageCount': ctypes.size_t},
  {'ReadOperationCount': ctypes.long_long},
  {'WriteOperationCount': ctypes.long_long},
  {'OtherOperationCount': ctypes.long_long},
  {'ReadTransferCount': ctypes.long_long},
  {'WriteTransferCount': ctypes.long_long},
  {'OtherTransferCount': ctypes.long_long} ]);

const SYSTEM_PROCESS_ID_INFORMATION = new ctypes.StructType("SYSTEM_PROCESS_ID_INFORMATION", [
  {'ProcessId': ctypes.long},
  {'ImageName': UNICODE_STRING} ]);

const SYSTEM_PROCESSOR_PERFORMANCE_INFORMATION = new ctypes.StructType("SYSTEM_PROCESSOR_PERFORMANCE_INFORMATION", [
  {'IdleTime': ctypes.long_long},
  {'KernelTime': ctypes.long_long},
  {'UserTime': ctypes.long_long},
  {'DpcTime': ctypes.long_long},
  {'InterruptTime': ctypes.long_long},
  {'InterruptCount': ctypes.unsigned_long} ]);
  
const SYSTEM_BASIC_INFORMATION = new ctypes.StructType("SYSTEM_BASIC_INFORMATION", [
  {'Reserved': ctypes.unsigned_long},
  {'TimerResolution': ctypes.unsigned_long},
  {'PageSize': ctypes.unsigned_long},
  {'NumberOfPhysicalPages': ctypes.unsigned_long},
  {'LowestPhysicalPageNumber': ctypes.unsigned_long},
  {'HighestPhysicalPageNumber': ctypes.unsigned_long},
  {'AllocationGranularity': ctypes.unsigned_long},
  {'MinimumUserModeAddress': ctypes.unsigned_long.ptr},
  {'MaximumUserModeAddress': ctypes.unsigned_long.ptr},
  {'ActiveProcessorsAffinityMask': ctypes.unsigned_long.ptr},
  {'NumberOfProcessors': ctypes.char} ]);

const OSVERSIONINFO = new ctypes.StructType("OSVERSIONINFO", [
  {'dwOSVersionInfoSize': ctypes.uint32_t},
  {'dwMajorVersion': ctypes.uint32_t},
  {'dwMinorVersion': ctypes.uint32_t},
  {'dwBuildNumber': ctypes.uint32_t},
  {'dwPlatformId': ctypes.uint32_t},
  {'szCSDVersion': ctypes.jschar.array(128)} ]);

const SERVICE_STATUS_PROCESS = new ctypes.StructType("SERVICE_STATUS_PROCESS", [
  {'dwServiceType': ctypes.uint32_t},
  {'dwCurrentState': ctypes.uint32_t},
  {'dwControlsAccepted': ctypes.uint32_t},
  {'dwWin32ExitCode': ctypes.uint32_t},
  {'dwServiceSpecificExitCode': ctypes.uint32_t},
  {'dwCheckPoint': ctypes.uint32_t},
  {'dwWaitHint': ctypes.uint32_t},
  {'dwProcessId': ctypes.uint32_t},
  {'dwServiceFlags': ctypes.uint32_t} ]);

const ENUM_SERVICE_STATUS_PROCESS = new ctypes.StructType("ENUM_SERVICE_STATUS_PROCESS", [
  {'lpServiceName': ctypes.jschar.ptr},
  {'lpDisplayName': ctypes.jschar.ptr},
  {'ServiceStatusProcess': SERVICE_STATUS_PROCESS} ]);

const LANGANDCODEPAGE = new ctypes.StructType("LANGANDCODEPAGE", [
  {'wLanguage': ctypes.uint16_t},
  {'wCodePage': ctypes.uint16_t} ]);

const NtQuerySystemInformation = lib_ntdll.declare("NtQuerySystemInformation", 
  ctypes.winapi_abi,
  ctypes.long, // return
  ctypes.int, // SystemInformationClass
  ctypes.void_t.ptr, // SystemInformation
  ctypes.unsigned_long, // SystemInformationLength
  ctypes.unsigned_long.ptr); // ReturnLength

const GetVersionExW = lib_kernel32.declare("GetVersionExW", 
  ctypes.winapi_abi,
  ctypes.bool, // return
  OSVERSIONINFO.ptr); // lpVersionInfo

const OpenProcess = lib_kernel32.declare("OpenProcess", 
  ctypes.winapi_abi,
  ctypes.voidptr_t, // return
  ctypes.uint32_t, // dwDesiredAccess
  ctypes.bool, // bInheritHandle
  ctypes.uint32_t); // dwProcessId

const GetProcessImageFileNameW = lib_psapi.declare("GetProcessImageFileNameW", 
  ctypes.winapi_abi,
  ctypes.uint32_t, // return
  ctypes.voidptr_t, // hProcess
  ctypes.jschar.ptr, // lpImageFileName
  ctypes.uint32_t); // nSize

const CloseHandle = lib_kernel32.declare("CloseHandle", 
  ctypes.winapi_abi,
  ctypes.bool, // return
  ctypes.voidptr_t); // hObject

const EnumServicesStatusExW = lib_advapi32.declare("EnumServicesStatusExW", 
  ctypes.winapi_abi,
  ctypes.bool, // return
  ctypes.void_t.ptr, // hSCManager
  ctypes.long, // InfoLevel
  ctypes.uint32_t, // dwServiceType
  ctypes.uint32_t, // dwServiceState
  ctypes.char.ptr, // lpServices
  ctypes.uint32_t, // cbBufSize
  ctypes.uint32_t.ptr, // pcbBytesNeeded
  ctypes.uint32_t.ptr, // lpServicesReturned
  ctypes.uint32_t.ptr, // lpResumeHandle
  ctypes.jschar.ptr); // pszGroupName

const OpenSCManagerW = lib_advapi32.declare("OpenSCManagerW", 
  ctypes.winapi_abi,
  ctypes.void_t.ptr, // return
  ctypes.jschar.ptr, // lpMachineName
  ctypes.jschar.ptr, // lpDatabaseName
  ctypes.uint32_t); // dwDesiredAccess

const CloseServiceHandle = lib_advapi32.declare("CloseServiceHandle", 
  ctypes.winapi_abi,
  ctypes.bool, // return
  ctypes.void_t.ptr); // hSCObject

const QueryDosDeviceW = lib_kernel32.declare("QueryDosDeviceW", 
  ctypes.winapi_abi,
  ctypes.uint32_t, // return
  ctypes.jschar.ptr, // lpDeviceName
  ctypes.jschar.ptr, // lpTargetPath
  ctypes.uint32_t); // ucchMax

const GetLogicalDrives = lib_kernel32.declare("GetLogicalDrives", 
  ctypes.winapi_abi,
  ctypes.uint32_t); // return

const GetFileVersionInfoSizeW = lib_versiondll.declare("GetFileVersionInfoSizeW", 
  ctypes.winapi_abi,
  ctypes.uint32_t, // return
  ctypes.jschar.ptr, // lptstrFilename
  ctypes.uint32_t.ptr); // lpdwHandle

const GetFileVersionInfoW = lib_versiondll.declare("GetFileVersionInfoW", 
  ctypes.winapi_abi,
  ctypes.bool, // return
  ctypes.jschar.ptr, // lptstrFilename
  ctypes.uint32_t, // dwHandle
  ctypes.uint32_t, // dwLen
  ctypes.void_t.ptr); // lpData

const VerQueryValue = lib_versiondll.declare("VerQueryValueW", 
  ctypes.winapi_abi,
  ctypes.bool, // return
  ctypes.void_t.ptr, // pBlock
  ctypes.jschar.ptr, // lpSubBlock
  ctypes.void_t.ptr.ptr, // lplpBuffer
  ctypes.unsigned_int.ptr); // puLen

const GetCurrentProcessId = lib_kernel32.declare("GetCurrentProcessId", 
  ctypes.winapi_abi,
  ctypes.uint32_t); // return

const STATUS_BUFFER_TOO_SMALL = 0xC0000023>>0;
const STATUS_INFO_LENGTH_MISMATCH = 0xC0000004>>0;
const SystemProcessInformation = 5;
const SystemProcessIdInformation = 88;
const SystemProcessorPerformanceInformation = 8;
const SystemBasicInformation = 0;
const SystemPerformanceInformation = 2;
const SYSTEM_IDLE_PROCESS_ID = 0;
const SYSTEM_PROCESS_ID = 4;
const MAX_PATH = 260;
const PROCESS_QUERY_INFORMATION  = 0x400;
const PROCESS_VM_READ = 0x10;
const SC_MANAGER_ENUMERATE_SERVICE = 0x4;
const SC_MANAGER_CONNECT = 0x1;
const SC_ENUM_PROCESS_INFO = 0;

const SERVICE_ACTIVE = 0x00000001;
const SERVICE_WIN32_OWN_PROCESS = 0x00000010;
const SERVICE_WIN32_SHARE_PROCESS = 0x00000020;
const SERVICE_WIN32 = SERVICE_WIN32_OWN_PROCESS | SERVICE_WIN32_SHARE_PROCESS;
