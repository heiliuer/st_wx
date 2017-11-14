// ======================
// 基于微信jssdk，录音上传插件
// @author hao.wang
// ======================
(function(factory) {
	if (typeof define === 'function') {
		define("wxy.voice.record",[],factory);
	} else {
		factory();
	}
})(function(require) {
	if (require) {
		var $ = require("jquery");;
	} else {
		var $ = window.jQuery || window.Zepto;
	}

	if (!$) {
		console.error("Zepto or jQuery is required");
	}

	var weixinReady=function(funcName,showLoading,clearLoading,showWarn){
		//处理微信版本
		var _isWeixin = navigator.userAgent.toLowerCase().match(/MicroMessenger/i) == "micromessenger";
		var _errorMsg="";
		var g_successCall=null;
		if(!_isWeixin&&!(window.wx&&wx.mask)){
			_errorMsg="当前使用的不是微信浏览器，无法使用"+funcName;
			console.log(_errorMsg);
		}else if(!window.wx){
			console.error("没有引入jweixin");
		}else{
			var loading=true;
			wx.ready(function(){
				_errorMsg="";
				loading=false;
				clearLoading("loading"+funcName);
				if(g_successCall){
					g_successCall();
					g_successCall=null;
				}
			});
			wx.error(function(){
				_errorMsg=funcName+"初始化失败，请联系技术支持";
				loading=false;
				clearLoading("loading"+funcName);
				showWarn(_errorMsg);
			});
		}
		return function(successCall){
			if(loading){
				g_successCall=successCall;
				showLoading("请稍等","loading"+funcName);
			}else if(_errorMsg!=""){
				showWarn(_errorMsg);
			}else{
				successCall();
			}
		};
	};

	var DEFAULTS = {
		// data={localId:,serverId:,duration}
		onStatusChanged : function(status, data, msg) {
		},
		// progress 单位秒
		onProgress : function(progress) {
		},
		// 【none 无操作 】【recordCancel录完未上传 】【recordFail录音出错 】【recordComplete录音完成
		// 】【recording 正在录音 】【uploading 正在上传 】【uploadComplete 上传完毕】
		msgs : {
			notSupport : "暂不支持录音功能，请尝试升级微信客户端，或者联系技术支持",
			notReady : "微信录音接口正在初始化，请稍后重试",
			none : "点击开始说话",
			recordCancel : "录音已取消",
			recordFail : "录音出错",
			none : "录音完成",
			recording : "正在录音",
			uploading : "正在上传",
			uploadComplete : "上传完成"
		},
		wx : {
			maxDuration : 60
		},
		showWarn : function(msg) {
			alert(msg);
		},
		showLoading:$.noop,
		clearLoading:$.noop,
		log : function() {
			// console.log(arguments);
		}
	};

	//
	var STATUS = {
		recording : "recording",
		recordCancel : "recordCancel",
		recordFail : "recordFail",
		recordComplete : "recordComplete",
		none : "none",
		uploading : "uploading",
		uploadComplete : "uploadComplete"
	};

	var WxRecorder = function($el, options) {
		this.$el = $el;
		this.options = $.extend(true, {}, DEFAULTS, options || {});
		this._status = STATUS.none;
		this._wexin=weixinReady("录音功能",options.showLoading,options.clearLoading,options.showWarn);
	};

	var ptype = WxRecorder.prototype;

	ptype.actionStartRecord=function(){
		if (!this.checkEnable()) {
			return;
		}
		var self = this;
		wx.startRecord({
			cancel : function(res) { //
				self.options.log("startRecord cancel:" + JSON.stringify(res));
				self.changeStatus(STATUS.recordCancel);
			},
			complete : function(res) {
				self.changeStatus(STATUS.recording);
				// $handler.data("startTime", new Date().getTime());
				self.options.log("startRecord complete:" + JSON.stringify(res));
			},
			fail : function(res) { //
				self.options.log("startRecord fail:" + JSON.stringify(res));
				self.changeStatus(STATUS.recordFail);
			}
		});
		wx.onVoiceRecordEnd({ // 录音时间超过一分钟没有停止的时候会执行 complete 回调
			complete : function(rs) {
				self.options
						.log("onVoiceRecordEnd begin:" + JSON.stringify(rs));
				self.changeStatus(STATUS.recordComplete);
				self.uploadRecord(rs);
				self.options.log("onVoiceRecordEnd end");
			}
		});
	}

	ptype.startRecord = function() {
		this._wexin($.proxy(ptype.actionStartRecord,this));
	};

	ptype.cancelRecord = function() {
		var self = this;
		if (this._status == STATUS.recording) {
			this.stopRecord(function(rs) {
						self.changeStatus(STATUS.recordCancel, rs);
					});
		} else {
			self.changeStatus(STATUS.recordCancel);
		}
	}

	ptype.uploadRecord = function(rs) {
		var self = this;
		self.changeStatus(STATUS.uploading);
		var localId = rs.localId;
		wx.uploadVoice({
					localId : localId,
					isShowProgressTips : 1,
					fail : function() {
						self.changeStatus(STATUS.uploadFail);
					},
					complete : function(rs) {
						rs.localId = localId;
						self.changeStatus(rs && rs.serverId
										? STATUS.uploadComplete
										: STATUS.uploadFail, rs);
					}
				});
	};

	ptype.stopRecord = function(complete) {
		var self = this;
		wx.stopRecord({
					fail : function(rs) {
						self.changeStatus(STATUS.none);
					},
					complete : function(rs) {
						if (rs && rs.localId) {
							complete(rs);
						} else {
							self.changeStatus(STATUS.none);
						}
					}
				});
	};

	ptype.completeRecord = function() {
		if (!this.checkEnable()) {
			return;
		}
		self = this;
		this.stopRecord(function(rs) {
					self.changeStatus(STATUS.recordComplete);
					self.uploadRecord(rs);
				});
	};

	ptype.clearTimer = function() {
		var timer = this.timer;
		if (timer) {
			clearInterval(timer);
		}
		this.options.log("clearTimer");
		return timer;
	};

	ptype.setTimer = function() {
		var self = this;
		self._startTime = new Date().getTime();
		self.options.log("setTimer");
		this.timer = setInterval(function() {
					var duration = (new Date().getTime() - self._startTime)
							/ 1000;
					var progress = Math.ceil(duration);
					self.options.onProgress(progress);
					self.options.log("recording:" + progress);
					if (duration > (60 - 0.7 * 2)) {// 解决安卓上60s不自动关闭的问题
						self.completeRecord();
					}
				}, 300);
	}


	ptype.checkEnable = function() {
		return true;
	}

	ptype.getDuration = function() {
		if (this._startTime) {
			return Math.ceil((new Date().getTime() - this._startTime) / 1000);
		}
		return 0;
	}

	ptype.getStatus = function() {
		return this._status;
	}
	ptype.changeStatus = function(toStatus, data, msg) {
		switch (toStatus) {
			case STATUS.none :
			case STATUS.recordCancel :
			case STATUS.recordFail :
			case STATUS.uploading :
				this.clearTimer();
				break;
			case STATUS.recordComplete :
				this._duration = this.getDuration();
				var maxDuration = this.options._wx.maxDuration;
				if (this._duration > maxDuration) {
					this._duration = maxDuration;
				}
				this.clearTimer();
				break;
			case STATUS.recording :
				this.setTimer();
				break;
			case STATUS.uploadComplete :
				this.clearTimer();
				data.duration = this._duration;
				break;
		}
		var fromStatus = this._status;
		this._status = toStatus;
		this.options.onStatusChanged(toStatus, data, msg);
		this.options.log("from " + fromStatus + " to " + toStatus, data, msg);
	};

	var old = $.fn.wxRecorder

	// 对外接口startRecord completeRecord cancelRecord enable
	// getDuration,getStatus 自定义返回值
	$.fn.wxRecorder = function(options) {
		var args = Array.prototype.slice.call(arguments, 1);
		var returnValFlag = false, returnVal;
		var handler = function() {
			var $this = $(this);
			var recorder = $this.data("wxy.voice.record");
			if (!recorder) {
				recorder = new WxRecorder($this, options);
				$this.data("wxy.voice.record", recorder);
			}
			if (typeof options == "string") {
				recorder.options.log("call method:" + options);
				if (["completeRecord", "cancelRecord", "startRecord", "enable"]
						.indexOf(options) != -1) {
					recorder[options].apply(recorder, args);
				} else if (["getDuration", "getStatus"].indexOf(options) != -1) {
					returnValFlag = true;
					returnVal = recorder[options].apply(recorder, args);
					return false;
				}
			}
		};
		this.each(handler);
		if (returnValFlag) {
			return returnVal;
		} else {
			return this;
		}
	}

	$.fn.wxRecorder.noConflict = function() {
		$.fn.wxRecorder = old
		return this
	}

	$.fn.wxRecorder.defaults = DEFAULTS;
});
