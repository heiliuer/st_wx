// ======================
// 基于微信jssdk，图片上传插件
// @author hao.wang
// ======================
(function (factory) {
    if (typeof define === 'function') {
        define("wxy.img.upload", [], factory);
    } else {
        factory();
    }
})(function (require) {
    if (require) {
        var $ = require("jquery");
        ;
    } else {
        var $ = window.jQuery || window.Zepto;
    }

    function log(s) {
        $("#console").off().click(function () {
            $(this).empty();
        }).append("" + s + "<hr/>");
    }

    var weixinReady = function (funcName, showLoading, clearLoading, showWarn) {
        //处理微信版本
        var _isWeixin = navigator.userAgent.toLowerCase().match(/MicroMessenger/i) == "micromessenger";
        var _errorMsg = "";
        var g_successCall = null;
        if (!_isWeixin && !(window.wx && wx.mask)) {
            _errorMsg = "当前使用的不是微信浏览器，无法使用" + funcName;
            console.log(_errorMsg);
        } else if (!window.wx) {
            console.error("没有引入jweixin");
        } else {
            var loading = true;
            wx.ready(function () {
                _errorMsg = "";
                loading = false;
                clearLoading("loading" + funcName);
                if (g_successCall) {
                    g_successCall();
                    g_successCall = null;
                }
            });
            wx.error(function () {
                _errorMsg = funcName + "初始化失败，请联系技术支持";
                loading = false;
                clearLoading("loading" + funcName);
                showWarn(_errorMsg);
            });
        }
        return function (successCall) {
            if (loading) {
                g_successCall = successCall;
                showLoading("请稍等", "loading" + funcName);
            } else if (_errorMsg != "") {
                showWarn(_errorMsg);
            } else {
                successCall();
            }
        };
    };
    var OPTIONS_DEFAULT = {
        maxCount: 200,
        complete: function (res) {
        },
        successUploadOne: function (res) {
        },
        failUploadOne: function (res) {
        },
        showWarn: function (msg) {
            alert(msg);
        },
        showLoading: function (msg) {
        },
        clearLoading: function () {
        }
    };

    $.fn.imgUpload = function (options) {
        options = $.extend(true, {}, OPTIONS_DEFAULT, options);
        var $holder = $(this);
        var localIds = [];
        var serverIds = [];
        var imgMaxCount = options.maxCount;

        var wexin = weixinReady("上传图片功能", options.showLoading, options.clearLoading, options.showWarn);
        // 点击增加图片
        var imgAddAction = function () {
            wx.chooseImage({
                success: function (res) {
                    options.clearLoading();
                    var resLocalIds = res.localIds.slice(0);
                    if (serverIds.length < imgMaxCount) {
                        // log("chooseImage success begin!");
                        var i = 0;

                        function upload() {
                            var resLocalId = resLocalIds[i];
                            wx.uploadImage({
                                localId: resLocalId,
                                success: function (res) {
                                    serverIds
                                        .push(res.serverId);
                                    localIds.push(resLocalId);
                                    regroup();
                                    i++;
                                    if (serverIds.length < imgMaxCount
                                        && i < resLocalIds.length) {
                                        setTimeout(upload, 100);
                                    }
                                },
                                fail: function (res) {
                                    log("uploadImage fail"
                                        + res);
                                }
                            });
                        }

                        setTimeout(upload, 100);
                    }
                },
                fail: function (res) {
                    log("choose fail:" + res);
                },
                complete: function (res) {
                    log("choose complete:" + res);
                }
            });
        }
        var action = function () {
            wexin(imgAddAction);
        };
        $holder.on("click", ".img-add", action);

        // 删除图片
        $holder.on("click", ".close", function () {
            var index = $(this).data("index");
            if (index < 0) {
                $(this).parent("li").remove();
                return;
            }
            localIds.splice(index, 1);
            serverIds.splice(index, 1);
            regroup();
        });
        /*
         * 重新排列图片
         */
        var $tmpl=$("#tmpl-img");
        var regroup = function () {
            var $ulUploadImgs = $holder.find("li:not(.img-add,.old)").remove();
            var lis = [];
            localIds.forEach(function (val, index) {
                var li=$tmpl.render({imgUrl:val,index:index});
                lis.push(li);
            });
            $holder.append(lis.join(""));
            $holder.find("[data-init]").trigger("init");
            if (localIds.length < imgMaxCount) {
                $(".actions-holder .add-img").removeClass("disabled");
            } else {
                $(".actions-holder .add-img").addClass("disabled");
            }
        }
        return {
            getLocalIds: function () {
                return localIds.slice(0);
            },
            getServerIds: function () {
                return serverIds.slice(0);
            },
            addImg: function (localId, serverId) {
                serverIds.push(serverId);
                localIds.push(localId);
                regroup();
            },
            action:action
        }
    }
});
