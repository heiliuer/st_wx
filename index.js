import Image from './packages/wx_image_uploader'
import Voice from './packages/wx_voice_uploader'

import _wx from './libs/jweixin'

const components = [
  Image,
  Voice,
]


const install = function (Vue, opts) {
  if (install.installed) return
  Vue.prototype.$wx = _wx
  components.map(function (component) {
    Vue.component(component.name, component)
  })
}

/* istanbul ignore if */
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

const _jsApiList = ['chooseImage', 'uploadImage', 'startRecord', 'stopRecord', 'onRecordEnd', 'playVoice', 'pauseVoice', 'stopVoice', 'uploadVoice', 'downloadVoice']

window.wx = _wx

export const ST_IMAGE_UPLOADER = Image
export const ST_VOICE_UPLOADER = Voice
export const wx = _wx
export const jsApiList = _jsApiList
export const isWx = navigator.userAgent.toLowerCase().match(/MicroMessenger/i) == "micromessenger"

export default {
  version: '1.3.3',
  install: install
}
