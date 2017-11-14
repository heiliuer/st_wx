<template>
  <div class="st_wx_compo st_wx_voice_uploader">

    <p v-if="!isWxBrowser">
      不是微信浏览器，功能不可用
    </p>

    <voice v-for="(item,index) in value" :voice="item" :key="item.localId">
      <span class="st_badge_del">
        <span class="weui-badge" @click="clickDel(index)"></span>
      </span>
    </voice>

    <div class="js_dialog" v-show="showDialog">
      <div class="weui-mask" @click="clickMask"></div>
      <div class="weui-dialog">
        <div class="weui-dialog__hd" v-show="false"><strong class="weui-dialog__title">弹窗标题</strong></div>
        <div class="weui-dialog__bd">
          <vux-circle
            :percent="percent"
            style="margin:20px auto;width: 100px;height: 100px;">
            {{durationStr}}
          </vux-circle>
        </div>
        <div class="weui-dialog__ft">
          <a href="javascript:;"
             @click="clickAction"
             class="weui-dialog__btn weui-dialog__btn_default">
            {{recording?'结束录音':'开始录音'}}
          </a>
        </div>
      </div>
    </div>

  </div>

</template>

<script>
  import wx from '../../../libs/jweixin'
  import Voice from './Voice.vue'
  import { isWxBrowser } from '../../../utils/WxUtils'
  const EVENT_ADD = 'add'
  function log (msg) {
//    alert(msg)
  }
  export default {
    name: 'StVoiceUploader',
    props: {
      maxDuration: {
        type: Number,
        default: 59,// 防止超出60s异常
      },
      value: { // v-modal
        type: Array,
        default(){
          return []
        }// [{serverId,url(localId||url),localId,duration}]
      }
    },
    data(){
      Object.assign(this, {
        isWxBrowser
      })
      return {
        duration: -1,// 跑时，单位s
        recording: false,
        uploading: false,
        startTime: 0,
        showDialog: false,
      }
    },
    methods: {
      triggerModelChange(){
        const vm = this
        vm.$emit('input', [...vm.value])
        log('images change:', JSON.stringify(vm.value))
      },
      clickMask(){
        const vm = this
        if (vm.recording || vm.uploading) {
        } else {
          vm.showDialog = false
        }
      },
      clickDel(index){
        const vm = this
        vm.value.splice(index, 1)
        vm.triggerModelChange()
      },
      clickAction(){
        const vm = this
        if (!vm.uploading) {
          if (vm.recording) {
            vm.stopAndComplete()
            vm.showDialog = false
          } else {
            vm.startRecord()
          }
        }
      },
      clearTimer(){
        clearInterval(this._timer)
      },
      startTimer(){
        const vm = this
        vm.clearTimer()
        vm.startTime = Date.now()
        vm._timer = setInterval(function () {
          const duration = Math.ceil((Date.now() - vm.startTime) / 1000)
          if (duration > (vm.maxDuration - 0.7 * 2)) {// 解决安卓上60s不自动关闭的问题
            vm.stopAndComplete()
          }
          vm.duration = duration
        }, 300)
      },
      startRecord(){
        const vm = this
        // 关闭所有语音
        Voice.BUS.$emit(Voice.BUS_EVENT_PAUSE)
        vm.duration = -1
        // 重新计时
        vm.stopRecord()
        wx.startRecord({
          cancel: function () {},
          complete: function () {
            vm.startTimer()
            vm.recording = true
          },
          fail: function () {}
        })
        wx.onVoiceRecordEnd({ // 录音时间超过一分钟没有停止的时候会执行 complete 回调
          complete: function (rs) {
            log('onVoiceRecordEnd:' + JSON.stringify(rs))
            vm.handleRecordComplete(rs.localId)
          }
        })
      },
      upload(localId, duration){
        const vm = this
        vm.uploading = true
        wx.uploadVoice({
          localId: localId,
          isShowProgressTips: 1,
          fail: function () {
            log('uploadVoice fail')
            vm.uploading = false
          },
          complete: function (res) {
            const voice = {
              serverId: res.serverId,
              localId,
              url: localId,
              duration
            }
            vm.value.push(voice)
            vm.triggerModelChange()
            vm.$emit(EVENT_ADD, {...voice})
            vm.uploading = false
          }
        })
      },
      resetDuration(){
        this.duration = -1
      },
      handleRecordComplete(localId){
        const vm = this
        vm.upload(localId, vm.duration)
        vm.resetDuration()
      },
      cancel(){
        const vm = this
        vm.stopRecord()
      },
      stopRecord(callback){
        const vm = this
        vm.recording = false
        vm.clearTimer()
        const hackCallback = (localId, success) => callback && callback(localId, success)
        wx.stopRecord({
          fail: function (rs) {
            hackCallback(rs.localId, false)
          },
          complete: function (rs) {
            hackCallback(rs.localId, true)
          }
        })
      },
      stopAndComplete(){
        const vm = this
        vm.clearTimer()
        vm.stopRecord((localId, success) => {
          if (!success) {
            log('stopRecord failed')
          } else {
            vm.handleRecordComplete(localId)
          }
        })
      },
      exportApi(){
        const vm = this
        vm.stShowRecord = () => {
          vm.showDialog = true
        }
      },
    },
    computed: {
      durationStr(){
        return this.duration > 0 ? (this.duration + 's') : '--'
      },
      percent(){
        let percent = this.duration / this.maxDuration
        if (percent < 0) {
          percent = 0
        }
        if ((percent - 1) > 0) {
          percent = 1
        }
        return percent * 100
      }
    },
    created(){
      const vm = this
      vm.exportApi()
    },
    components: {
      Voice,
      VuxCircle: require('./VuxCircle.vue')
    }
  }
</script>

<style>
  @import "./styles.css";
</style>
