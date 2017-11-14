import ElImageUploader from './src/ImageUploader.vue'

ElImageUploader.install = function (Vue) {
  Vue.component(ElImageUploader.name, ElImageUploader)
}

export default ElImageUploader
