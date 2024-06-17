<template>
   <div class="chatContent">
      <div class="mask" v-show="mask.valid">
         <div class="valid">
            <header>未经授权,请先进行验证</header>
            <img src="../assets/hutao/valid.jpg" />
            <input type="password" v-model="valid.userMsg" @keyup.enter="userValid()" />
            <el-button type="danger" @click="userValid()" style="margin-left:5.7%;margin-top:2%;width:89.8%;height:11.5%;font-size:17px;border-radius:0px">验 证</el-button>
         </div>
      </div>
      <div class="myChat">
         <el-scrollbar>
            <div class="twochat" v-for="chat of chatList[chatId - 1].content" :key="chat.id">
               <h5 class="username" v-show="elShowIf.username">{{ thema.uname }}</h5>
               <h5 :class="thema.userDateClass">{{chat.userDate}}</h5>
               <img :src="thema.imgsrc" :class="thema.userhClass" />
               <div :class="thema.userTextClass">{{ chat.user }}</div><br>
               <CopyDocument :class="thema.copyClass" @click="copyTextToClipboard(chat.user)" /><br>

               <h5 class="gptname" v-show="elShowIf.gptname">ChatGPT</h5>
               <h5 :class="thema.gptDateClass">{{chat.gptDate}}</h5>
               <img src="../assets/gpt.png" :class="thema.gptHeadClass" />
               <div :class="thema.gptTextClass">{{ chat.gpt }}</div><br>
               <CopyDocument id="copyDocument" :class="thema.copyClass" @click="copyTextToClipboard(chat.gpt)" />
               <Refresh :class="thema.refreshClass" @click="regetMessage(chat.id)" v-show="refreshShowIf(chat.id)" />
            </div>
         </el-scrollbar>
      </div>
      <div class="logo">
         <div>吾心吾行澄如明镜</div>
         <div>所作所为皆属正义</div>
         <img src="../assets/hutao/h3.jpg" />
      </div>
      <div class="userMsg">
         <el-tooltip effect="dark" content="设置" placement="top">
            <Setting :class="thema.settingClass" @click="openSetting" />
         </el-tooltip>
         <el-tooltip effect="dark" content="删除当前聊天内容" placement="top">
            <Delete :class="thema.deleteClass" @click="deleteContent(chatId)" />
         </el-tooltip>
         <input type="text" class="userContent" @keyup.enter="getMessage()" v-model="newUserContent" @focus="userContentBorder($event.target)" @blur="userContentBorder2($event.target)" />
         <el-button @click="getMessage()" :disabled="sendButton()" :type="thema.buttonType" size="large" icon="Position" style="width:6.5%;height:50%;position:absolute;right:2%;top:20%;" />
      </div>
      <div class="mask" v-show="mask.setting">
         <div :class="thema.settingBoxClass" v-show="elShowIf.setting">
            <h3>配置</h3>
            <Close class="closeIcon" @click="closeSetting()" /><br>
            <el-form :model="formData" label-suffix=":">
               <el-form-item label="API-KEY">
                  <el-input v-model="formData.key" clearable />
               </el-form-item>

               <el-form-item label="model">
                  <el-select v-model="formData.model">
                     <el-option v-for="model in formData.models" :label="model.modelName" :value="model.modelName" :key="model.modelId" />
                  </el-select>
               </el-form-item>

               <el-form-item label="自定义ChatGPT">
                  <p>你希望ChatGPT了解你哪些信息以便提供更好的回答?</p>
                  <el-input v-model="formData.systemContent1" />
                  <p>你希望ChatGPT如何回应你?</p>
                  <el-input v-model="formData.systemContent2" />
               </el-form-item>

               <el-form-item label="个性主题">
                  <el-radio-group v-model="formData.thema" @change="themaChange()" size="small">
                     <el-radio label="绿色" border />
                     <el-radio label="蓝色" border />
                     <el-radio label="红色" border />
                  </el-radio-group>
               </el-form-item>

               <el-form-item label="清除缓存">
                  <el-button @click="clearAllMessage()">清空</el-button>
               </el-form-item>
            </el-form>
            <el-button @click="saveParam" :type="thema.buttonType" class="saveButton">保存</el-button>
         </div>
      </div>
      <div v-show="elShowIf.operation">
         <Operation class="operation" @click="chatBoxShowIf()" />
      </div>
   </div>
</template>


<script setup>
import { ref, reactive, onMounted, watch, onBeforeMount, onBeforeUpdate, onUpdated } from "vue"
import emitter from "../utils/event-bus"
import { ElMessage } from "element-plus"
import { fetchEventSource } from '@microsoft/fetch-event-source'
/* data */
let chatId = ref(1)//当前聊天记录的id
const ctrl = new AbortController()//用于fetch
let sbr = [
   '正是因为我是一个贪图享乐的人,才更明白人生中有些珍贵的瞬间是不能错过的',
   "在叫马来之前，要不要干一杯呢？……就为『触网而弹起的网球』干杯,如何?不行吗?那...就敬下一个『遗体』吧...",
   '男人心中,要有一副指引自己走出荒野的地图',
   '『文明』『粮食』『民心』『财富』『光荣』『幸福』『权利』『法律』领导世界的人将是第一个拿起餐巾的人。本人!已经拿起最初的餐巾了!',
   '我已经决定吃喜欢的东西,过短命的人生',
   '假设有人拿起『右边』的餐巾那么其他所有人都不得不跟着选择『右边』的餐巾;如果那人拿起的是『左边』，那所有人都只能选择『左边』，这就是所谓的『社会』...',
   '吾心吾行澄如明镜，所作所为皆属正义',
   '结果谁都无法知道,因触网而弹起的网球会落到哪一边,就是因为这样,人们才会希望『女神』真的存在。如果她真的存在的话,不管最后的结果如何,我都能坦然接受',
   '我并不期待能死于病床上,我是个牛仔。我只求一个能够回去的地方...一个在远游后，还等着我回去的地方...',
   '这是一场『试炼』,我认为这是一场让我战胜过去的『试炼』,我接受了,只有在战胜那不成熟的过去后,人才能有所成长...你不也是一样吗?'
]
let apikey = ref('hk-s6vh29100003214872b98abc265f09731c8640024ce9907a')
let newUserContent = ref('')//发送框
let gptParams = reactive([//chatgpt接口参数
   {
      messageId: 1,
      gptParam: {
         model: 'gpt-3.5-turbo',
         messages: [
            { role: 'system', content: '我是一个男大学生,作为我的傲娇女朋友和我对话,在括号里附上必要的动作描述' }
         ],
         stream: true
      }
   }
])
let formData = reactive({//设置框的表单参数
   key: 'hk-s6vh29100003214872b98abc265f09731c8640024ce9907a',
   model: 'gpt-3.5-turbo',
   models: [{ modelName: 'gpt-3.5-turbo', modelId: 1 }, { modelName: 'gpt-4-1106-preview', modelId: 2 }],
   systemContent1: '我是一个男大学生',
   systemContent2: '作为我的傲娇女朋友和我对话,在括号里附上必要的动作描述',
   thema: '红色'
})
let chatList = reactive([//聊天记录的集合(用于渲染)
   {
      chatId: 1,
      content: [{//当前聊天记录
         id: 0,
         user: gptParams[chatId.value - 1].gptParam.messages[0].content,
         gpt: '爱情?梦想?年轻人需要的并不是那么天真的东西。没错,就是钙质,只要多多吸收钙质,做什么事都会顺利',
         userDate: '',
         gptDate: ''
      }]
   }
])
let thema = reactive({
   uname: '胡桃',
   settingClass: 'setting',
   settingBoxClass: 'settingBox',
   copyClass: 'copyDocument',
   refreshClass: 'refresh',
   userhClass: 'userh',
   gptHeadClass: 'gptHead',
   buttonType: 'danger',
   userTextClass: 'userText',
   gptTextClass: 'gptText',
   imgsrc: '/src/assets/hutao/h2.jpg',
   color: 'red',
   deleteClass: 'deleteClass',
   userDateClass: 'userDate',
   gptDateClass: 'gptDate'
})
let mask = reactive({//遮罩层
   setting: false,//设置框
   valid: true//验证窗
})
let elShowIf = reactive({//部分元素的显示与否
   setting: false,
   username: true,
   gptname: true,
   chatBox: true,
   operation: true
})
let valid = reactive({//验证窗口
   userMsg: '',
   password: '032418'
})




/* watch */
watch(chatId, (newval, oldval) => {
   console.log('chatId:' + oldval + '-->' + newval)
})


/* methods */
function getMessage() {
   let tempNewUserContent = newUserContent.value//临时变量
   let newChat = { id: chatList[chatId.value - 1].content.length, user: tempNewUserContent, gpt: '', userDate: getDate(), gptDate: '' }
   chatList[chatId.value - 1].content.push(newChat)//chatList[chatId.value - 1].content是当前聊天记录
   gptParams[chatId.value - 1].gptParam.messages.push({ role: 'user', content: tempNewUserContent })
   newUserContent.value = ''//清空输入框

   const eventSource = fetchEventSource('/v1/chat/completions', {
      method: "POST",
      headers: {
         'Content-Type': 'application/json',
         'Authorization': 'Bearer ' + apikey.value
      },
      body: JSON.stringify(gptParams[chatId.value - 1].gptParam),//对象->JSON字符串
      signal: ctrl.signal,
      openWhenHidden: true,
      onmessage(event) {
         if (event.data != '[DONE]') {
            let result = JSON.parse(event.data)//JSON字符串->对象
            let content = result.choices[0].delta.content
            let finish_reason = result.choices[0].finish_reason
            if (finish_reason != 'stop') {
               chatList[chatId.value - 1].content[chatList[chatId.value - 1].content.length - 1].gpt += content
            }
            else {//gpt已经全部响应
               chatList[chatId.value - 1].content[chatList[chatId.value - 1].content.length - 1].gptDate = getDate()
               gptParams[chatId.value - 1].gptParam.messages.push({ role: 'assistant', content: chatList[chatId.value - 1].content[chatList[chatId.value - 1].content.length - 1].gpt })
               localStorage.setItem('chatList', JSON.stringify(chatList))
               localStorage.setItem('gptParams', JSON.stringify(gptParams))
            }
         }
      },
      onopen(response) {
         console.log('连接成功!')
         if (response.status == 429) {
            chatList[chatId.value - 1].content[chatList[chatId.value - 1].content.length - 1].gpt = '429 Too Many Requests: You exceeded your current quota, please check your plan and billing details'
            gptParams[chatId.value - 1].gptParam.messages.push({ role: 'assistant', content: chatList[chatId.value - 1].content[chatList[chatId.value - 1].content.length - 1].gpt })
            localStorage.setItem('chatList', JSON.stringify(chatList))
            localStorage.setItem('gptParams', JSON.stringify(gptParams))
         }
      },
      onclose() {
         console.log('连接关闭!')
      },
      onerror(error) {
         console.log('连接断开!')
         throw error//防止重复发送请求
      }
   })
}
function saveParam() {//保存设置
   apikey.value = formData.key
   gptParams[chatId.value - 1].gptParam.model = formData.model
   gptParams[chatId.value - 1].gptParam.messages[0].content = formData.systemContent1 + ',' + formData.systemContent2
   chatList[chatId.value - 1].content[0].user = formData.systemContent1 + ',' + formData.systemContent2
   localStorage.setItem('formData', JSON.stringify(formData))
   localStorage.setItem('chatList', JSON.stringify(chatList))
   localStorage.setItem('gptParams', JSON.stringify(gptParams))
   elShowIf.setting = false
   mask.setting = false
   ElMessage.success({ message: '保存成功' })
}
function closeSetting() {
   elShowIf.setting = false
   mask.setting = false
}
function openSetting() {
   elShowIf.setting = true
   mask.setting = true
}
function userContentBorder(el) {
   if (formData.thema == '绿色')
      el.style.border = '1px solid lightgreen'

   else if (formData.thema == '蓝色')
      el.style.border = '1px solid lightblue'

   else
      el.style.border = '1px solid rgba(255, 89, 0, 0.245)'

}
function userContentBorder2(el) {
   el.style.border = '1px solid lightgrey'
}
function sendButton() {//是否禁用发送按钮
   if (newUserContent.value == '')
      return true
   else
      return false
}
function copyTextToClipboard(text) {//复制文本
   if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
      ElMessage.success({ message: '复制成功', duration: 500 })
   }
   else {
      let textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "absolute"//使text area不在viewport，同时设置不可见
      textArea.style.opacity = 0
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      return new Promise((res, rej) => {//执行复制命令并移除文本框
         document.execCommand('copy') ? res() : rej()
         textArea.remove()
         ElMessage.success({ message: '复制成功', duration: 500 })
      })
   }
}
function regetMessage(chatContentId) {//重新响应
   while (chatList[chatId.value - 1].content.length != chatContentId + 1) {
      chatList[chatId.value - 1].content.pop()
      gptParams[chatId.value - 1].gptParam.messages.pop()
      gptParams[chatId.value - 1].gptParam.messages.pop()
   }
   gptParams[chatId.value - 1].gptParam.messages.pop()
   chatList[chatId.value - 1].content[chatList[chatId.value - 1].content.length - 1].gpt = ''
   console.log(chatList[chatId.value - 1].content);
   console.log(gptParams[chatId.value - 1].gptParam.messages);
   const eventSource = fetchEventSource('/v1/chat/completions', {
      method: "POST",
      headers: {
         'Content-Type': 'application/json',
         'Authorization': 'Bearer ' + apikey.value
      },
      body: JSON.stringify(gptParams[chatId.value - 1].gptParam),
      signal: ctrl.signal,
      openWhenHidden: true,
      onmessage(event) {
         if (event.data != '[DONE]') {
            let result = eval("(" + event.data + ")")//JSON字符串->对象
            let content = eval("(" + event.data + ")").choices[0].delta.content
            let finish_reason = result.choices[0].finish_reason
            if (finish_reason != 'stop') {
               chatList[chatId.value - 1].content[chatList[chatId.value - 1].content.length - 1].gpt += content
            }
            else {//gpt已经全部响应
               chatList[chatId.value - 1].content[chatList[chatId.value - 1].content.length - 1].gptDate = getDate()
               gptParams[chatId.value - 1].gptParam.messages.push({ role: 'assistant', content: chatList[chatId.value - 1].content[chatList[chatId.value - 1].content.length - 1].gpt })//实现上下文聊天
               localStorage.setItem('chatList', JSON.stringify(chatList))
               localStorage.setItem('gptParams', JSON.stringify(gptParams))
            }
         }
      },
      onopen(response) {
         console.log('连接成功!')
         if (response.status == 429) {
            chatList[chatId.value - 1].content[chatList[chatId.value - 1].content.length - 1].gpt = '429 Too Many Requests: You exceeded your current quota, please check your plan and billing details'
            gptParams[chatId.value - 1].gptParam.messages.push({ role: 'assistant', content: chatList[chatId.value - 1].content[chatList[chatId.value - 1].content.length - 1].gpt })
            localStorage.setItem('chatList', JSON.stringify(chatList))
            localStorage.setItem('gptParams', JSON.stringify(gptParams))
         }
      },
      onclose() {
         console.log('连接关闭!')
      },
      onerror(error) {
         console.log('连接断开!')
         throw error//防止重复发送请求
      }
   })
}
function refreshShowIf(chatContentId) {//是否显示refesh图标
   if (chatContentId > 0)
      return true
   else
      return false
}
function LingHua() {
   document.getElementsByClassName('chatContent')[0].style.backgroundColor = 'rgba(240, 248, 255, 0.745)'
   thema.uname = '绫华'
   thema.copyClass = 'copyDocument_blue'
   thema.refreshClass = 'refresh_blue'
   thema.settingClass = 'setting_blue'
   thema.userTextClass = 'userText_blue'
   thema.gptTextClass = 'gptText_blue'
   if (window.innerWidth < 935) {
      thema.userTextClass += '_mobile'
      thema.gptTextClass += '_mobile'
   }
   thema.deleteClass = 'deleteClass_blue'
   thema.imgsrc = '/src/assets/linghua/l2.jpg'
   thema.buttonType = 'primary'
   thema.color = 'rgba(0, 0, 255, 0.771)'
   document.getElementsByClassName('logo')[0].getElementsByTagName('div')[0].style.color = 'lightblue'
   document.getElementsByClassName('logo')[0].getElementsByTagName('div')[1].style.color = 'lightblue'
   document.getElementsByClassName('logo')[0].getElementsByTagName('img')[0].src = 'src/assets/linghua/l3.jpg'
}
function NaXiDa() {
   document.getElementsByClassName('chatContent')[0].style.backgroundColor = 'rgba(144, 238, 167, 0.103)'
   thema.uname = '小草'
   thema.copyClass = 'copyDocument_green'
   thema.refreshClass = 'refresh_green'
   thema.settingClass = 'setting_green'
   thema.userTextClass = 'userText_green'
   thema.gptTextClass = 'gptText_green'
   if (window.innerWidth < 935) {
      thema.userTextClass += '_mobile'
      thema.gptTextClass += '_mobile'
   }
   thema.deleteClass = 'deleteClass_green'
   thema.imgsrc = '/src/assets/naxida/n5.jpg'
   thema.buttonType = 'success'
   thema.color = 'green'
   document.getElementsByClassName('logo')[0].getElementsByTagName('div')[0].style.color = 'rgba(0, 128, 0, 0.415)'
   document.getElementsByClassName('logo')[0].getElementsByTagName('div')[1].style.color = 'rgba(0, 128, 0, 0.415)'
   document.getElementsByClassName('logo')[0].getElementsByTagName('img')[0].src = 'src/assets/naxida/n4.jpg'
}
function HuTao() {
   document.getElementsByClassName('chatContent')[0].style.backgroundColor = 'rgba(255, 136, 0, 0.04)'
   thema.uname = '胡桃'
   thema.copyClass = 'copyDocument'
   thema.refreshClass = 'refresh'
   thema.settingClass = 'setting'
   thema.userTextClass = 'userText'
   thema.gptTextClass = 'gptText'
   if (window.innerWidth < 935) {
      thema.userTextClass += '_mobile'
      thema.gptTextClass += '_mobile'
   }
   thema.deleteClass = 'deleteClass'
   thema.imgsrc = '/src/assets/hutao/h2.jpg'
   thema.buttonType = 'danger'
   thema.color = 'red'
   document.getElementsByClassName('logo')[0].getElementsByTagName('div')[0].style.color = 'rgba(255, 89, 0, 0.245)'
   document.getElementsByClassName('logo')[0].getElementsByTagName('div')[1].style.color = 'rgba(255, 89, 0, 0.245)'
   document.getElementsByClassName('logo')[0].getElementsByTagName('img')[0].src = 'src/assets/hutao/h3.jpg'
}
function themaChange() {
   if (formData.thema == '蓝色')
      LingHua()
   else if (formData.thema == '绿色')
      NaXiDa()
   else
      HuTao()
   emitter.emit('thema', formData.thema)
}
function themaRandom() {
   let themaNumber = Math.floor(Math.random() * 3) + 1//[0,4)
   if (themaNumber == 1)
      formData.thema = '蓝色'
   else if (themaNumber == 2)
      formData.thema = '绿色'
   else if (themaNumber == 3)
      formData.thema = '红色'
   themaChange()
}
function deleteContent(delChatId) {//删除聊天内容
   let content = chatList[delChatId - 1].content
   let gptMessage = gptParams[delChatId - 1].gptParam.messages
   while (gptMessage.length > 1)
      gptMessage.pop()
   if (content.length > 1) {
      while (content.length > 1)
         content.pop()
      localStorage.setItem('chatList', JSON.stringify(chatList))
      localStorage.setItem('gptParams', JSON.stringify(gptParams))
      ElMessage.success({ message: '删除成功', duration: 600 })
   }
   else
      ElMessage.warning({ message: '无法删除', duration: 600 })
}
function userValid() {//验证
   if (valid.userMsg == valid.password) {
      mask.valid = false
      ElMessage.success({ message: '验证成功', duration: 1000 })
   }
   else
      ElMessage.error({ message: '验证失败', duration: 700 })
   valid.userMsg = ''
}
function clearAllMessage() {//清空缓存
   localStorage.clear()
   ElMessage.success({ message: '缓存已全部清除', duration: 600 })
   location.reload()
}
function windowResize() {//window窗口变化时的回调函数
   window.addEventListener('resize', () => {
      let chatContentEl = document.getElementsByClassName('chatContent')[0]
      if (chatContentEl.offsetWidth < 1000) {//uname和gptname显示与否
         elShowIf.username = false
         elShowIf.gptname = false
         chatContentEl.style.width = '100%'
      }
      else {
         elShowIf.username = true
         elShowIf.gptname = true
         chatContentEl.style.width = '78%'
      }

      if (chatContentEl.offsetWidth > 500) {//chatBox展开与否
         elShowIf.operation = false
         elShowIf.chatBox = true
      }
      else {
         elShowIf.operation = true
         elShowIf.chatBox = false
      }
   })

}
function mobileInit() {//移动端初始化
   if (window.innerWidth < 935) {//移动端初始化
      elShowIf.username = false
      elShowIf.gptname = false
      elShowIf.chatBox = false
      document.getElementsByClassName('chatContent')[0].style.width = '100%'
      document.getElementsByClassName('logo')[0].style.width = "0%"
      document.getElementsByClassName('myChat')[0].style.width = "100%"
      document.getElementsByClassName('myChat')[0].style.paddingTop = "10%"
      document.getElementsByClassName('deleteClass')[0].style.display = "none"
      document.getElementsByClassName('userContent')[0].style.width = "70%"
      document.getElementsByClassName('userContent')[0].style.marginLeft = "10px"
      document.getElementsByClassName('userMsg')[0].getElementsByTagName('button')[0].style.width = '50px'
      document.getElementsByClassName('closeIcon')[0].style.bottom = '94%'
      document.getElementsByClassName('closeIcon')[0].style.left = '92%'


      thema.userhClass = 'userh_mobile'; thema.gptHeadClass = 'gptHead_mobile'
      thema.userDateClass = 'userDate_mobile'; thema.gptDateClass = 'gptDate_mobile'
      thema.settingBoxClass += '_mobile'

   }
   if (document.getElementsByClassName('chatContent')[0].offsetWidth > 500)
      elShowIf.operation = false
}
function chatBoxShowIf() {//控制chatBox显示(点击事件)
   if (elShowIf.chatBox == false) {//展开chatBox
      elShowIf.chatBox = true
      document.getElementsByClassName('chatContent')[0].style.width = '20%'
      emitter.emit("chatboxExpand", 'expand')
      elShowIf.operation = false
   }
}
function getDate() {
   const dateCN = new Date();
   const formatterCN = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
   })
   return formatterCN.format(dateCN)
}
function touchChange() {//滑动屏幕
   let chatContent = document.getElementsByClassName('chatContent')[0]
   let startx; let starty; let endx; let endy
   chatContent.addEventListener('touchstart', (el) => {
      let touch = el.changedTouches
      startx = touch[0].clientX;
      starty = touch[0].clientY;
   })
   chatContent.addEventListener('touchend', (el) => {
      let touch = el.changedTouches
      endx = touch[0].clientX;
      endy = touch[0].clientY;
      if (endx - startx > 100)//右滑
         chatBoxShowIf()
   })
}



/* 钩子 */
onBeforeMount(() => {
   if (localStorage.getItem('chatList') != null)
      chatList = reactive(JSON.parse(localStorage.getItem('chatList')))
   if (localStorage.getItem('gptParams') != null)
      gptParams = reactive(JSON.parse(localStorage.getItem('gptParams')))
   if (localStorage.getItem('formData') != null)
      formData = reactive(JSON.parse(localStorage.getItem('formData')))
   chatList[0].content[0].gpt = sbr[Math.floor(Math.random() * sbr.length)]//(0,sbr.length)
})
onMounted(() => {
   emitter.on('chatId', (val) => {//当前聊天记录
      chatId.value = val
      console.log('当前聊天记录id: ' + val)
   })
   emitter.on('newChatId', (val) => {//新建聊天记录
      let sbr_gpt = sbr[Math.floor(Math.random() * sbr.length)]//(0,sbr.length)
      chatList.push({ chatId: val, content: [{ id: 0, user: '我是一个男大学生,作为我的傲娇女朋友和我对话,在括号里附上必要的动作描述', gpt: sbr_gpt }] })
      let msgAndGpt = {
         messageId: val,
         gptParam: {
            model: 'gpt-3.5-turbo',
            messages: [
               { role: 'system', content: '我是一个男大学生,作为我的傲娇女朋友和我对话,在括号里附上必要的动作描述' }
            ],
            stream: true
         }
      }
      gptParams.push(msgAndGpt)
      localStorage.setItem('chatList', JSON.stringify(chatList))
      localStorage.setItem('gptParams', JSON.stringify(gptParams))
   })
   emitter.on('delChatId', (val) => {//删除聊天记录
      if (val == 1)//删除聊天内容
         deleteContent(1)
      else {
         if (val == chatList.length)//如果删除的是最后一个聊天记录集
            chatId.value = 1
         chatList.splice(val - 1, 1)
         for (var i = val - 1; i < chatList.length; i++)
            chatList[i].chatId = i + 1
         gptParams.splice(val - 1, 1)
         for (var i = val - 1; i < gptParams.length; i++)
            gptParams[i].messageId = i + 1
         localStorage.setItem('chatList', JSON.stringify(chatList))
         localStorage.setItem('gptParams', JSON.stringify(gptParams))
      }
   })
   emitter.on('mobileInit', (val) => {//移动端初始化
      if (val == 'mobileIndex') {
         elShowIf.chatBox = false
         elShowIf.operation = true
         document.getElementsByClassName('chatContent')[0].style.width = "100%"
         document.getElementsByClassName('logo')[0].style.width = "0%"
         document.getElementsByClassName('myChat')[0].style.width = "100%"
      }
   })
   windowResize()
   touchChange()//滑动屏幕
   themaRandom()
   mobileInit()//移动端
})

</script>


<style scoped lang="less">
@import '../myStyle/chatContent/mobile.less'; //移动端
@import '../myStyle/chatContent/blue.less'; //蓝色主题
@import '../myStyle/chatContent/green.less'; //绿色主题
@keyframes slide-in-bl {
   0% {
      transform: translateY(1000px) translateX(-1000px);
      opacity: 0;
   }
   100% {
      transform: translateY(-50%) translateX(-50%);
      opacity: 1;
   }
}
.chatContent {
   width: 78%;
   height: 100%;
   background-color: rgba(255, 136, 0, 0.04);
   display: flex;
   flex-wrap: wrap;
   transition: all 0.4s;
   position: relative;
}
.myChat {
   width: 84%;
   height: 84%;
   padding-top: 3%;
}
.logo {
   width: 16%;
   height: 88%;
   position: relative;
   overflow: hidden;
   img {
      position: absolute;
      left: 22%;
      width: 63%;
      bottom: 10%;
      transition: all 0.4s;
      opacity: 0.8;
      &:hover {
         width: 66%;
      }
   }
   div:nth-child(1) {
      position: absolute;
      color: rgba(255, 89, 0, 0.245);
      width: 1%;
      left: 28%;
      top: 4%;
      font: 33px 楷体;
   }
   div:nth-child(2) {
      position: absolute;
      color: rgba(255, 89, 0, 0.245);
      width: 1%;
      left: 54%;
      top: 5%;
      font: 33px 楷体;
      margin-top: 30%;
   }
}
.userMsg {
   width: 100%;
   height: 11%;
   position: relative;
   overflow: hidden;
   .setting {
      color: grey;
      width: 25px;
      transition: all 0.4s;
      position: absolute;
      top: 26%;
      left: 1.3%;
      &:hover {
         color: red;
      }
   }
   .deleteClass {
      color: rgba(128, 128, 128, 0.815);
      width: 25px;
      transition: all 0.4s;
      position: absolute;
      top: 26%;
      left: 4.5%;
      &:hover {
         color: red;
      }
   }
   .userContent {
      left: 8%;
      top: 20%;
      position: absolute;
      width: 80.5%;
      height: 50.5%;
      border: 1px solid lightgrey;
      outline: none;
      border-radius: 5px;
      background: none;
      padding-left: 8px;
      font-size: 15px;
      transition: all 0.2s;
      margin-right: 10%;
   }
}
.twochat {
   width: 80%;
   height: auto;
   margin-left: 12%;
   margin-bottom: 15px;
   position: relative;
   .userh {
      position: absolute;
      margin-left: 10%;
      top: 5%;
      width: 6%;
      border: 2px solid white;
      border-radius: 100%;
      opacity: 0.8;
   }
   .username {
      position: absolute;
      margin-left: 17.2%;
      font-size: 85%;
      margin-top: 2%;
   }
   .userDate {
      position: absolute;
      left: 22%;
      margin-top: 2%;
      color: grey;
   }
   .userText {
      margin-left: 17%;
      margin-top: 4.5%;
      display: inline-block;
      color: rgba(0, 0, 0, 0.758);
      background-color: rgba(255, 0, 0, 0.136);
      border-radius: 7px;
      padding: 1%;
      font-size: 90%;
   }
   .gptHead {
      margin-top: 1%;
      margin-left: 10%;
      position: absolute;
      width: 5.7%;
      border: 2px solid white;
      border-radius: 100%;
   }
   .gptname {
      position: absolute;
      font-size: 85%;
      margin-left: 17.2%;
      margin-top: 2%;
   }
   .gptDate {
      position: absolute;
      left: 25.5%;
      margin-top: 2%;
      color: grey;
   }
   .gptText {
      margin-left: 17%;
      margin-top: 4.5%;
      display: inline-block;
      color: rgba(0, 0, 0, 0.76);
      background-color: rgba(119, 136, 153, 0.225);
      border-radius: 7px;
      padding: 1%;
      font-size: 90%;
   }
   .copyDocument {
      margin-top: 1%;
      margin-left: 18%;
      color: grey;
      width: 15px;
      transition: all 0.2s;
      &:hover {
         color: red;
      }
   }
   .refresh {
      color: grey;
      margin-left: 0.5%;
      margin-top: 1%;
      width: 15px;
      transition: all 0.2s;
      &:hover {
         color: red;
      }
   }
}
.settingBox {
   padding: 2% 3%;
   position: fixed;
   left: 50%;
   top: 50%;
   transform: translate(-50%, -50%);
   width: 35%;
   height: 56%;
   border: solid whitesmoke 2px;
   background-color: white;
   transition: all 0.3s;
   animation: slide-in-bl 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
   overflow: hidden;
   h3 {
      transform: translate(45%);
   }
   .closeIcon {
      position: absolute;
      left: 94.6%;
      bottom: 93.3%;
      color: grey;
      width: 4%;
      transition: all 0.4s;
      padding: 5px;
      &:hover {
         background-color: red;
         color: white;
      }
   }
   .el-button.saveButton {
      width: 80px;
      border: 1px solid white;
      position: absolute;
      left: 40%;
   }
}
.el-tooltip__trigger {
   outline: none;
}
.mask {
   position: fixed;
   top: 0;
   right: 0;
   bottom: 0;
   left: 0;
   background-color: rgba(221, 221, 221, 0.5);
   z-index: 100;
   display: flex;
   justify-content: center;
   align-items: center;
}
.valid {
   background-color: #f0f0f0;
   border-radius: 5px;
   width: 560px;
   height: 330px;
   header {
      margin-top: 3%;
      font: 22px 楷体;
      text-align: center;
      color: red;
      text-shadow: 2px 2px 5px yellow;
   }
   img {
      width: 20%;
      margin-left: 38%;
      margin-top: 5%;
   }
   input {
      background-color: #f0f0f0;
      width: 88%;
      margin-left: 6%;
      margin-top: 4%;
      height: 10%;
      border: grey 1px solid;
      outline: none;
      font-size: 15px;
      padding-left: 5px;
   }
}
.operation {
   width: 27px;
   position: absolute;
   left: 2%;
   top: 2%;
   color: grey;
   transition: all 0.3s;
   &:hover {
      color: rgba(0, 0, 0, 0.878);
   }
}
</style>