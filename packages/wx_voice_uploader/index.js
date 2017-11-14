import VoiceUploader from './src/VoiceUploader.vue'

VoiceUploader.install = function (Vue) {
  Vue.component(VoiceUploader.name, VoiceUploader)
}

export default VoiceUploader
