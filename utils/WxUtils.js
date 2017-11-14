/**
 * Created by Administrator on 2017-7-7.
 */
/**是否是微信浏览器
 * @return {boolean}
 */
export const isWxBrowser = navigator.userAgent.toLowerCase().match(/MicroMessenger/i) == 'micromessenger'

/**
 * 微信图片预览接口
 * @param urls 图片url数组
 * @param current 当前图片url
 */
export const imagePreview = function (urls, current) {
  if ('WeixinJSBridge' in window) {
    WeixinJSBridge.invoke('imagePreview', {
      'current': current || urls[0],
      'urls': urls
    })
  } else {
    console.log('WeixinJSBridge 不支持')
  }
}
