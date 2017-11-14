<template>
  <div class="st_wx_compo st_wx_image_uploader">

    <p v-if="!isWxBrowser">
      不是微信浏览器，功能不可用
    </p>

    <div class="weui-uploader">

      <div class="weui-uploader__hd" v-if="showTitle">
        <p class="weui-uploader__title">图片上传</p>
        <div class="weui-uploader__info">{{value.length}}/{{maxSize}}</div>
      </div>

      <div class="weui-uploader__bd">
        <ul class="weui-uploader__files st_wx_image_list" id="uploaderFiles">

          <li class="weui-uploader__file"
              :style="{backgroundImage:'url('+item.url+')'}"
              @click="previewImg(index,$event)"
              v-for="(item,index) of value">

              <span class="st_badge_del">
                <span class="weui-badge" @click="clickDel(index)"></span>
              </span>

          </li>
          <!--<li class="weui-uploader__file weui-uploader__file_status" style="background-image:url(./images/pic_160.png)">-->
          <!--<div class="weui-uploader__file-content">-->
          <!--<i class="weui-icon-warn"></i>-->
          <!--</div>-->
          <!--</li>-->
          <!--<li class="weui-uploader__file weui-uploader__file_status" style="background-image:url(./images/pic_160.png)">-->
          <!--<div class="weui-uploader__file-content">50%</div>-->
          <!--</li>-->
        </ul>
        <div class="weui-uploader__input-box" v-if="showAddBtn" @click="clickAdd" v-show="!isOverMaxSize"></div>
      </div>
    </div>

  </div>
</template>

<script>
  import wx from '../../../libs/jweixin'
  import {isWxBrowser} from "../../../utils/WxUtils";
  function log(msg) {
//    alert(msg)
  }

  const EVENT_ADD = 'add'
  const EVENT_ADDS = 'adds'

  export default {
    name: 'StImageUploader',
    data(){
      Object.assign(this, {isWxBrowser})
      return {}
    },
    props: {
      maxSize: {
        type: Number,
        default: 8,
      },
      value: { // v-modal
        type: Array,
        default(){
          return []
        }// [{serverId,url(localId||url),localId}]
      },
      showTitle: {
        type: Boolean,
        default: false
      },
      showAddBtn: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      triggerModelChange(){
        const vm = this
        vm.$emit('input', [...vm.value])
        log('images change:', JSON.stringify(vm.value))
      },
      clickAdd(){
        const vm = this
        if (vm.isOverMaxSize) {
        } else {
          vm.choose()
        }
      },
      previewImg(index, event){
        const vm = this
        if (!event.target.classList.contains('weui-uploader__file')) {
          return
        }
        const currentImg = vm.value[index];
        if (!!currentImg) {
          wx.previewImage({
            current: currentImg.url, // 当前显示图片的http链接
            urls: vm.value.map(img => img.url) // 需要预览的图片http链接列表
          });
        }
      },
      choose(){
        const vm = this
        wx.chooseImage({
          success(res){
            vm.uploadImages(res.localIds)
//            vm.upload(res.localIds)
          },
          fail(res){
            log("choose fail:", res);
          },
          complete (res) {
            log("choose complete:", res);
          }
        })
      },
      upload(localId, callback){
        const vm = this
        if (vm.isOverMaxSize) {
          return
        }
        const hackCallback = (image) => callback && callback(image)
        wx.uploadImage({
          localId,
          success (res) {
            const image = {
              serverId: res.serverId,
              localId,
              url: localId,
            };
            vm.value.push(image)
            vm.triggerModelChange()
            const hackImage = {...image}
            vm.$emit(EVENT_ADD, hackImage)
            hackCallback(hackImage)
          },
          fail (res) {
            log("uploadImage fail", res)
            hackCallback()
          }
        });
      },
      uploadImages(localIds){
        const vm = this
        const needUploadIds = [...localIds]
        const newUploadedImages = []
        const upload = () => {
          // console.log({needUploadIds})
          if (needUploadIds.length && !vm.isOverMaxSize) {
            vm.upload(needUploadIds.shift(), image => {
              if (image) {
                newUploadedImages.push(image)
              }
              upload()
            })
          } else {
            console.log({newUploadedImages})
            vm.$emit(EVENT_ADDS, newUploadedImages)
          }
        }
        upload()
      },
      clickDel(index){
        const vm = this
        vm.value.splice(index, 1)
        vm.triggerModelChange()
      },
      exportApi(){
        const vm = this
        vm.stStart = () => {
          vm.clickAdd()
        }
      },
    },
    computed: {
      valueSize(){
        return (this.value || []).length
      },
      isOverMaxSize(){
        return this.valueSize >= this.maxSize
      }
    },
    created(){
      const vm = this
      vm.exportApi()
    }
  }
</script>

<style>
  @import "styles.css";
</style>
