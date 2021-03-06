'use strict';

define([
    'app',
    "common/comp/datatable"
], function (app) {
    var configureCtrl = function ($scope, $http) {
        $('[rel="popover"],[data-rel="popover"]').popover();
        $scope.reportGroup = [];
        $scope.toggleCheck= function(flag, group) {
            if (flag) {
                $scope.reportGroup.push(group);
            } else {
                var index = $scope.reportGroup.indexOf(group);
                if (index !== -1) {
                    $scope.reportGroup.splice(index, 1);
                }
            }
        };
        $http.get('/configure/getUrl').
            success(function(json, status, headers, config) {
                if (json.code != 100000 || json.data.length <= 0) { 
                }
                $scope.urls = json.data;
                $scope.groups = [];
                for (var i in json.data) {
                    if ($scope.groups.indexOf(json.data[i].group) === -1) {
                        $scope.groups.push(json.data[i].group);
                    }
                }
            });
        $scope.sendReport = function() {
            var inputNode = $("input[type=text]")[0];
            if (!$scope.addrs) {
                $scope.emailError = true;
                return;
            }
            var addrs = $scope.addrs.split(',');
            if (addrs.length == 0) {
                $scope.emailError = true;
                return;
            }
            for (var i in addrs) {
                if (!/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/i.test(addrs[i])) {
                    $scope.emailError = true;
                    return;
                }
            }
            if (!$scope.reportMonth) {
                $scope.emailError = true;
                return;
            }
            if ($scope.reportGroup.length == 0) {
                return;
            }

            $http.post('/util/sendReport', {
                addrs: JSON.stringify(addrs),
                month: $scope.reportMonth,
                group: JSON.stringify($scope.reportGroup)
            }).success(function(json, status, headers, config) {
                if (json.code != 100000) {
                    alert('发送失败！');
                }
                else {
                    alert('发送成功！')
                }
            });
        };
        $scope.doError = function($event) {
            console.log(error);
        };
        $scope.newUrl = function($event) {
            var inputNodes = $("input", $($event.currentTarget).parent().parent());
            if (!$scope.newUrlName) {
                inputNodes[0].focus();
                $(inputNodes[0]).parent().parent().addClass('control-group error');
                return;
            }
            if (!$scope.newUrlAddr) {
                inputNodes[1].focus();
                $(inputNodes[1]).parent().parent().addClass('control-group error');
                return;
            }
            // maybe there are some bugs here, u should modify it for yourself
            var val = $scope.newUrlAddr.toLowerCase();
            var strRegex = "^((https|http|ftp|rtsp|mms)://)" +
                "(([0-9a-z_!~*'().&=+$%-]+: )?[0-9a-z_!~*'().&=+$%-]+@)?" + //ftp的user@  
                "(([0-9]{1,3}\.){3}[0-9]{1,3}" + // IP形式的URL- 199.194.52.184  
                "|" + // 允许IP和DOMAIN（域名） 
                "([0-9a-z_!~*'()-]+\.)*" + // 域名- www.
                "([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\." + // 二级域名 
                "[a-z]{2,6})" + // first level domain- .com or .museum
                "(:[0-9]{1,4})?"; // 端口- :80
            var re = new RegExp(strRegex);
            if (!re.test(val) || !/\./g.test(val)) {
                inputNodes[1].focus();
                $(inputNodes[1]).parent().parent().addClass('control-group error');
                return;
            }
            
            $(inputNodes[0]).parent().parent().removeClass('control-group error');
            $(inputNodes[1]).parent().parent().removeClass('control-group error');

            $http.post('/configure/addUrl', {
                name: $scope.newUrlName,
                group: $scope.newGroup,
                user: $scope.newUrlUser,
                password: $scope.newUrlPassword,
                addr: $scope.newUrlAddr,
                ua: $scope.newUrlUA
            }).success(function(json, status, headers, config) {
                    if (json.code != 100000) {
                        alert('new addr error');
                    } else {
                        $scope.urls.push({
                            name: $scope.newUrlName,
                            group: $scope.newGroup,
                            user: $scope.newUrlUser, 
                            password: $scope.newUrlPassword, 
                            addr: $scope.newUrlAddr,
                            ua: $scope.newUrlUA
                        });
                        $scope.newUrlName = '';
                        $scope.newGroup = '';
                        $scope.newUrlAddr = '';
                        $scope.newUrlUser = '';
                        $scope.newUrlPassword = '';
                        $scope.newUrlUA = '';
                    }
                });
        };
        $scope.editUrl = function($event, index) {
            $scope.urls[index].editFlag = !$scope.urls[index].editFlag;
            $scope.urls[index].oName = $scope.urls[index].name;
            $scope.urls[index].oGroup = $scope.urls[index].group;
            $scope.urls[index].oEmail = $scope.urls[index].email;
            $scope.urls[index].oUser = $scope.urls[index].user;
            $scope.urls[index].oPassword = $scope.urls[index].password;
            $scope.urls[index].oUA = $scope.urls[index].ua;
        };
        $scope.delUrl = function($event, index) {
            $http.post('/configure/delUrl', {
                id: $scope.urls[index]._id
            }).success(function(json, status, headers, config) {
                    if (json.code != 100000) {
                        alert('new addr error');
                    } else {
                        $scope.urls.splice(index, 1);
                    }
                });
        };
        $scope.saveUrl = function($event, index) {
            var trNode = $($event.currentTarget).parent().parent();

            $http.post('/configure/editUrl', {
                id: $scope.urls[index]._id,
                name: $scope.urls[index].name,
                group: $scope.urls[index].group,
                addr: $scope.urls[index].addr,
                user: $scope.urls[index].user,
                password: $scope.urls[index].password,
                ua: $scope.urls[index].ua
            }).success(function(json, status, headers, config) {
                    if (json.code != 100000) {
                        alert('new addr error');
                    } else {
                        $scope.urls[index].editFlag = !$scope.urls[index].editFlag;
                        $scope.urls[index].oName = '';
                        $scope.urls[index].oGroup = '';
                        $scope.urls[index].oEmail = '';
                        $scope.urls[index].oUser = '';
                        $scope.urls[index].oPassword = '';
                        $scope.urls[index].oUA = '';
                    }
                });
        };
        $scope.cancelUrl = function($event, index) {
            $scope.urls[index].editFlag = !$scope.urls[index].editFlag;
            $scope.urls[index].name = $scope.urls[index].oName;
            $scope.urls[index].group = $scope.urls[index].oGroup;
            $scope.urls[index].email = $scope.urls[index].oEmail;
            $scope.urls[index].user = $scope.urls[index].oUser;
            $scope.urls[index].password = $scope.urls[index].oPassword;
            $scope.urls[index].ua = $scope.urls[index].oUA;
        };
    };
    app.register.controller('configureCtrl', ['$scope', '$http', configureCtrl]);

});
