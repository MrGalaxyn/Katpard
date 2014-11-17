var require = patchRequire(require);
var fs = require('fs');
var url = 'http://weibo.com/login.php';
var login_cookies = require('weibo_cookies');

module.exports = function(username, password) {
    /**************************handler*****************************/
    var error_handler =  function() {
        this.die("error: [" + this.getCurrentUrl() + "] login failed! >> no expect selector", 1);
        // this.capture("error_" + new Date().getTime() + ".png");
    };
    var check_login_page = function() {
        return /login\.php$/.test(this.getCurrentUrl());
    };
    var do_login = function() {
        casper.waitForSelector('input[name=username]', function() {
            // this.echo("start login...");
            this.evaluate(function(username, password) {
                var tmp = document.querySelectorAll("input[name=username]");
                for (var i = 0; i < tmp.length; i++) {
                    tmp[i].value = username;
                }
                var tmp = document.querySelectorAll("input[name=password]");
                for (var i = 0; i < tmp.length; i++) {
                    tmp[i].focus();
                    tmp[i].value = password;
                }
                var tmp = document.querySelectorAll("a[action-type=btn_submit]");
                for (var i = 0; i < tmp.length; i++) {
                    var oEvent = document.createEvent("MouseEvents");
                    oEvent.initMouseEvent("click", true, true); 
                    tmp[i].dispatchEvent(oEvent);
                }
            }, username, password);
            // casperjs 按钮功能太简单了，捉急啊。。。
            // this.click('a[action-type=btn_submit]');
            // this.capture("summary.png");
        }, error_handler, 10000);
    };

    var weibo_login_handler =  function() {
        // this.echo(this.getCurrentUrl() + " redirect...");
        // this.capture("redirect.png");
        this.click('p.p1.line a');
        casper.then(do_login);
    };
    /************************handler end****************************/

    casper.open(url);
    
    casper.thenBypassIf(function() {
        return /^http:\/\/weibo.com\/u/.test(this.getCurrentUrl());
    }, 2);

    casper.waitFor(check_login_page, do_login, weibo_login_handler);

    casper.then(function() {
        this.waitWhileSelector('input[name=username]', function() {
            this.echo("login done...");
            login_cookies.writeCookie(username);
            casper.exit(0);
            // this.capture("done.png");
        }, error_handler, 10000);
    });
}