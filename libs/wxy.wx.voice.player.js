// ======================
// 基于微信jssdk，录音播放插件
// @author hao.wang
// ======================
(function(factory) {
	if (typeof define === 'function') {
		define("wxy.wx.voice.player",[],factory);
	} else {
		factory();
	}
})(function(require) {
			if (require) {
				var $ = require("jquery");;
			} else {
				var $ = window.jQuery || window.Zepto;
			}
			var DEFAULTS = {
				showMsg : function(msg) {
					alert(msg);
				},
				log : function() {
					// console.log(arguments);
				},
				onStop : function(duration) {
				},
				onPlay : function(duration) {
				},
				onPause : function(duration, progress) {
				},
				onProgress : function(duration, progress) {
					// console.log("default:", duration, progress);
				},
				configs : {
					dataLocalId : "voice-local-id",
					dataServerId : "voice-server-id",
					dataDuration : "voice-duration"
				}
			};

			var _isWeixin=navigator.userAgent.toLowerCase().match(/MicroMessenger/i) == "micromessenger";
			
			var WxVoicePlayer = function($el, options) {
				this.$el = $el;
				this.options = $.extend(true, {}, DEFAULTS, options || {});
				this.localId = $el.data(this.options.configs.dataLocalId);
				this.serverId = $el.data(this.options.configs.dataServerId);
				this.duration = $el.data(this.options.configs.dataDuration);
				if (this.localId == "") {
					console.error("localId is invalid!");
				}
				this.playing = false;
			};

			var ptype = WxVoicePlayer.prototype;

			//
			ptype.play = function(cb) {
				var self = this;
				var $el = this.$el;
				var localId = this.localId;
				var serverId = this.serverId;
				var onPlay = this.options.onPlay;
				wx.playVoice({
							localId : localId,
							complete : function() {
								onPlay && onPlay.call($el);
								self.clearTimer();
								if (!self.paused) {
									self.tstart = new Date().getTime();
									self.progress = 0;// 单位s
									if (self.playing) {
										wx.stopVoice({
													localId : localId
												});
									}
								}
								self.paused = false;
								self.playing = true;
								self.setTimer();
								$.isFunction(cb) && cb();
							}
						});
				wx.onVoicePlayEnd({
							serverId : serverId,
							complete : function(res) {
								self.stop();
							}
						});
			};

			ptype.pause = function(cb) {
				var self = this;
				var $el = this.$el;
				var localId = this.localId;
				var onPause = this.options.onPause;
				wx.pauseVoice({
							localId : localId,
							complete : function() {
								onPause && onPause.call($el, self.duration);
								self.clearTimer();
								self.paused = true;
								self.playing = false;
								$.isFunction(cb) && cb();
							}
						});
			};

			ptype.clearTimer = function() {
				var timer = this.timer;
				if (timer) {
					clearInterval(timer);
				}
				return timer;
			}

			ptype.setTimer = function() {
				var self = this;
				var onProgress = this.options.onProgress;
				this.timer = setInterval(function() {
							self.progress = Math
									.ceil((new Date().getTime() - self.tstart)
											/ 1000);
							onProgress
									&& onProgress.call(self.$el, self.duration,
											self.progress);
						}, 700);
			}

			ptype.stop = function(cb) {
				var self = this;
				var $el = this.$el;
				var localId = this.localId;
				var onStop = this.options.onStop;
				wx.stopVoice({
							localId : localId,
							complete : function() {
								onStop && onStop.call($el, self.duration);
								self.clearTimer();
								self.paused = false;
								self.playing = false;
								$.isFunction(cb) && cb();
							}
						});
			};

			ptype.isPlaying = function() {
				return this.playing;
			};

			ptype.isPaused = function() {
				return this.paused;
			};

			ptype.setOnPlay = function(onPlay) {
				this.options.onPlay = onPlay;
			};

			ptype.setOnPause = function(onPause) {
				this.options.onPause = onPause;
			};

			ptype.setOnStop = function(onStop) {
				this.options.onStop = onStop;
			};

			// onProgress(progress,duration,percent)
			ptype.setOnProgress = function(onProgress) {
				this.options.onProgress = onProgress;
			};

			var API_METHODS = ["play", "pause", "stop", "setOnPlay",
					"setOnPause", "setOnStop", "setOnProgress"];
			var API_RT_VAL_METHODS = ["isPlaying", "isPaused"];

			if (window.Zepto) {
				$.expr[':']["voice_playing"] = function(index) {
					var $sel = $(this);
					var player = $sel.data("wxy.player");
					if (player && player.isPlaying && player.isPlaying()) {
						return this;
					}
				};
			} else if (window.jQuery) {
				$.expr[':']["voice_playing"] = function(el) {
					var player = $(el).data("wxy.player");
					return player && player.isPlaying && player.isPlaying();
				};
			}

			$.fn.wxVoicePlayer = function(options) {
				var args = Array.prototype.slice.call(arguments, 1);
				var returnValFlag = false, returnVal;
				var handler = function() {
					var $this = $(this);
					var player = $this.data("wxy.player");
					if (!player) {
						player = new WxVoicePlayer($this, options);
						$this.data("wxy.player", player);
					}
					if (typeof options == "string") {
						player.options.log("call method:" + options);
						if (API_METHODS.indexOf(options) != -1) {
							player[options].apply(player, args);
						} else if (API_RT_VAL_METHODS.indexOf(options) != -1) {
							returnValFlag = true;
							returnVal = player[options].apply(player, args);
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
			};

			$.fn.wxVoicePlayer.DEFAULTS = DEFAULTS;
		});
