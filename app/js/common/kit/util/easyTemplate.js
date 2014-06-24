/*
 *  @author : wudi
 *  @time : 2013-11-26
 *  @see http://www.w3cgroup.com/article.asp?id=300
 *  <#et tname dataname> //模板开始标签，tname为此模板的名称，dataname为此模板中用到的数据名称
 *  <#if (condition)>
 *  <#elseif (condition)>
 *  <#else>
 *  </#if>
 *  ${x?a:b} //三元表达式，最后不能加分号"；" 注意：在所有的 {} 中都不能出现分号！
 *  <#list List as list> //遍历一个数组对象
 *  ${list_index} //在此次遍历中的当前索引
 *  ${list.xxx} //取值
 *  </#list> //结束遍历
 *  </#et> //模板结束标签
 * 
 *  @example：
 *  var x = easyTemplate(sTemplate,oData);
 *  或者当一个模板不变，数据经常变动时可以这样使用：
 *  //先将模板解析好以备用
 *  var tp = easyTemplate(sTemplate);
 *  //在需要用新的数据渲染该模板时调用：
 *  var shtml = tp(oData);
 */

define(function (){
    var easyTemplate = function(s,d){
        if(!s){return '';}
        if(s!==easyTemplate.template){
            easyTemplate.template = s;
            easyTemplate.aStatement = easyTemplate.parsing(easyTemplate.separate(s));
        }
        var aST = easyTemplate.aStatement;
        var process = function(d2){
            if(d2){d = d2;}
            return arguments.callee;
        };
        process.toString = function(){
            return (new Function(aST[0],aST[1]))(d);
        };
        return process;
    };
    easyTemplate.separate = function(s){
        var r = /\\'/g;
        var sRet = s.replace(/(<(\/?)#(.*?(?:\(.*?\))*)>)|(')|([\r\n\t])|(\$\{([^\}]*?)\})/g,function(a,b,c,d,e,f,g,h){
            if(b){return '{|}'+(c?'-':'+')+d+'{|}';}
            if(e){return '\\\'';}
            if(f){return '';}
            if(g){return '\'+('+h.replace(r,'\'')+')+\'';}
        });
        return sRet;
    };
    easyTemplate.parsing = function(s){
        var mName,vName,sTmp,aTmp,sFL,sEl,aList,aStm = ['var aRet = [];'];
        aList = s.split(/\{\|\}/);
        var r = /\s/;
        while(aList.length){
            sTmp = aList.shift();
            if(!sTmp){continue;}
            sFL = sTmp.charAt(0);
            if(sFL!=='+'&&sFL!=='-'){
                sTmp = '\''+sTmp+'\'';aStm.push('aRet.push('+sTmp+');');
                continue;
            }
            aTmp = sTmp.split(r);
            switch(aTmp[0]){
                case '+et':mName = aTmp[1];vName = aTmp[2];aStm.push('aRet.push("<!--'+mName+' start--\>");');break;
                case '-et':aStm.push('aRet.push("<!--'+mName+' end--\>");');break;
                case '+if':aTmp.splice(0,1);aStm.push('if'+aTmp.join(' ')+'{');break;
                case '+elseif':aTmp.splice(0,1);aStm.push('}else if'+aTmp.join(' ')+'{');break;
                case '-if':aStm.push('}');break;
                case '+else':aStm.push('}else{');break;
                case '+list':aStm.push('if('+aTmp[1]+'.constructor === Array){with({i:0,l:'+aTmp[1]+'.length,'+aTmp[3]+'_index:0,'+aTmp[3]+':null}){for(i=l;i--;){'+aTmp[3]+'_index=(l-i-1);'+aTmp[3]+'='+aTmp[1]+'['+aTmp[3]+'_index];');break;
                case '-list':aStm.push('}}}');break;
                default:break;
            }
        }
        aStm.push('return aRet.join("");');
        return [vName,aStm.join('')];
    };

    
    return {
        easyTemplate: easyTemplate
    };
});
