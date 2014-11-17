var require = patchRequire(require);
var fs = require('fs');
var url = 'https://xui.ptlogin2.qq.com/cgi-bin/xlogin?appid=46000101&style=23&lang=&low_login=1&hide_border=1&hide_title_bar=1&hide_close_icon=1&border_radius=1&self_regurl=http%3A//reg.t.qq.com/index.php&proxy_url=http://t.qq.com/proxy_t.html&s_url=http%3A%2F%2Ft.qq.com%2F&daid=6';
var login_cookies = require('tencent_cookies');

module.exports = function(username, password) {
    /**************************handler*****************************/
    var error_handler =  function() {
        this.die("error: [" + this.getCurrentUrl() + "] login failed! >> no expect selector", 1);
        // this.capture("error_" + new Date().getTime() + ".png");
    };
    var do_login = function() {
        casper.waitForSelector('input[name=u]', function() {
            this.echo("start login...");
            this.evaluate(function(username, password) {
                var tmp = document.querySelectorAll("input[name=u]");
                for (var i = 0; i < tmp.length; i++) {
                    tmp[i].focus();
                    tmp[i].value = username;
                }
                var tmp = document.querySelectorAll("input[name=p]");
                for (var i = 0; i < tmp.length; i++) {
                    tmp[i].focus();
                    tmp[i].value = password;
                }
                setTimeout(function() {
                    var tmp = document.querySelectorAll("input#login_button");
                    for (var i = 0; i < tmp.length; i++) {
                        var oEvent = document.createEvent("MouseEvents");
                        oEvent.initMouseEvent("click", true, true); 
                        tmp[i].dispatchEvent(oEvent);
                    }
                }, 1000)
            }, username, password);
            // casperjs 按钮功能太简单了，捉急啊。。。
            // this.click('input#login_button');
            // this.capture("summary.png");
        }, error_handler, 60000);
    };
    /************************handler end****************************/

    casper.open(url);
    
    do_login();
    casper.then(function() {
        this.waitWhileSelector('input[name=u]', function() {
            this.echo("login done...");
            login_cookies.writeCookie(username);
            // this.capture("done.png");
        }, error_handler, 60000);
    });

}