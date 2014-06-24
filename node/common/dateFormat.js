Date.prototype.format = function(format) 
{ 
    var o = { 
        "M+" : this.getMonth() + 1, 
        "d+" : this.getDate(), 
        "h+" : this.getHours(), 
        "m+" : this.getMinutes(), 
        "s+" : this.getSeconds(), 
        "q+" : Math.floor((this.getMonth() + 3) / 3), 
        "S" : this.getMilliseconds()
    } 
     
    if (/(y+)/.test(format)) 
    { 
        format = format.replace(RegExp.$1, 
            (this.getFullYear() + "").substr(4 - RegExp.$1.length)); 
    } 
     
    for (var k in o) 
    { 
        if (new RegExp("(" + k + ")").test(format)) 
        { 
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : 
                ("00" + o[k]).substr(("" + o[k]).length)); 
        } 
    } 
    return format; 
}

Date.prototype.getLastMonthDateTimestamp = function(year, month) 
{ 
    var ts = new Date(year, month).getTime(); // 1st day of the month
    var lastMonthDate = new Date(ts - 1);
    var max = parseInt(lastMonthDate.getTime() / 1000);
    var min = parseInt(new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth()).getTime() / 1000);
    return {max:max, min:min};
}

module.exports = Date;