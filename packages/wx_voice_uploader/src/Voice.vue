<template>
  <div class="st_wx_compo st_wx_voice">
    <div class="wx_notice_voice" :class="{'wx_voice_playing':playing}" @click="clickAction">
      <div class="wx_voice_trangle"></div>
      <!--静态图片-->
      <img src="./images/voice.png" class="wx_voice_static">
      <img src="./images/voice.gif" class="wx_voice_play">
      <!--{{voice.duration}}-->
      <slot></slot>
    </div>
    <span class="st_voice_duration">{{voice.duration}}s</span>
  </div>

</template>

<script>
  import wx from '../../../libs/jweixin'
  import Vue from 'vue'

  const BUS = new Vue()

  const BUS_EVENT_NEW_PLAY = 'play'

  const BUS_EVENT_PAUSE = 'pause'

  export default {
    BUS, BUS_EVENT_PAUSE, BUS_EVENT_NEW_PLAY,
    name: 'StVoice',
    props: {
      voice: {
        type: Object
      }
    },
    data(){
      return {
        playing: false,
        compoId: 'voice_' + Date.now()
      }
    },
    methods: {
      clickAction(event){
        // 排除删除按钮
        const vm = this
        let classList = event.target.classList
        if (classList.contains('st_badge_del')||classList.contains('weui-badge')) {
          if (vm.playing) vm.pause()
          return
        }
        if (vm.playing) {
          vm.pause()
        } else {
          vm.play()
        }
      },
      play(){
        const vm = this
        BUS.$emit(BUS_EVENT_NEW_PLAY, vm.compoId)
        wx.playVoice({
          localId: vm.localId,
          complete: function () {
            vm.playing = true
          }
        });
        wx.onVoicePlayEnd({
          serverId: vm.serverId,
          complete: function (res) {
            vm.playing = false
          }
        });
      },
      pause(){
        const vm = this
        wx.pauseVoice({
          localId: vm.localId,
          complete: function () {
            vm.playing = false
          }
        });
      }
    },
    computed: {
      localId(){
        return this.voice.localId
      },
      serverId(){
        return this.voice.serverId
      }
    },
    created(){
      const vm = this

      // 有语音点击了播放，判断是否是当前语音，不是则暂停当前播放
      BUS.$on(BUS_EVENT_NEW_PLAY, compoId => {
        if (vm.compoId != compoId && vm.playing) {
          vm.pause()
        }
      })

      //
      BUS.$on(BUS_EVENT_PAUSE, () => vm.pause())
    }
  }
</script>

<style scoped>
  .st_voice_duration {
    position: relative;
    bottom: 10px;
    display: inline-block;
    color: #888;
  }

  .wx_notice_voice {
    display: inline-block;
    position: relative;
    width: 200px;
    height: 40px;
    margin: 10px 0 10px 4px;
    background-color: #A0F274;
    border-radius: 4px;
  }

  .wx_notice_voice img {
    position: absolute;
    left: 5%;
    height: 60%;
    top: 20%;
  }

  .wx_notice_voice .wx_voice_play {
    display: none;
  }

  .wx_voice_playing .wx_voice_play {
    display: inherit;
  }

  .wx_voice_playing .wx_voice_static {
    display: none;
  }

  .wx_voice_trangle {
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-right: 6px solid #A0F274;
    position: absolute;
    left: -5px;
    top: 36%;
  }

</style>
