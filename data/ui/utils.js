function formatDate(date){
  var d = new Date(date);
  return d.getFullYear() + '-' + ('0' + (d.getMonth()+1)).substr(-2) + '-' +
    ('0'+d.getDate()).substr(-2) + ' ' + d.toTimeString().substr(0,8);
}
function formatRunTime(tMs){
  if (tMs < 1000) return tMs + " ms";
  if (tMs < 1000*600) return (tMs/1000).toFixed(2)  + " s";
  var res = new Date(0,0,0,0,0,0,tMs).toTimeString().substr(0,8);
  if (tMs > 86400000) res = (tMs/86400000).toFixed() + "d " + res;
  return res;
}
function formatBytes(val) {
  val = parseInt(val);
  var sizes = ["B", "KB", "MB", "GB", "TB"],  i = 0;
  if (val == 0) return val;
  while(val >= 1024 && i < 4) {i++; val /= 1204;}
  return (Math.round(val*100)/100) + " " + sizes[i];
}
function formatByteRate(val){
  return (val == 0) ? 0 : formatBytes(val) + "/s";
}
function formatNum(num){
  var re = /(\d+)(\d{3})/; 
  num = "" + parseInt(num);
  while (re.test(num))
    num = num.replace(/(\d+)(\d{3})/, '$1,$2');
  return num;
}
function escapeTags(str){
  return str.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
}
