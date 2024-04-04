<template>
   <div class="chatBox">
      <button :class="thema.newChatClass" @click="newChat">新 建 聊 天</button>
      <div class="chats">
         <div v-for='chat of chats' :key='chat.id' @click="sendChatId(chat.id, $event.target)">
            <el-icon>
               <ChatDotRound v-show="elShowIf.chatDot" />
            </el-icon>
            {{chat.content}}
            <el-icon v-show="chat.saveIcon" @click="saveName(chat)" style="position:absolute;right:28px">
               <DocumentChecked />
            </el-icon>
            <el-icon v-show="chat.editIcon" @click="renameChat(chat)" style="position:absolute;right:28px">
               <EditPen />
            </el-icon>
            <input type="text" v-show="chat.renameInput" @keyup.enter="saveName(chat)" v-model="chat.content" style="width:20%;height:30%;background:none;">
            <el-icon @click.stop="deleteChat(chat)" v-show="elShowIf.deleteFilled" style="position:absolute;right:5px">
               <DeleteFilled />
            </el-icon>
         </div>
      </div>
      <div class="userInfo">
         <img src="../assets/hutao/h2.jpg" style="width:22%;border-radius:100%;position:absolute;left:5%;top:15%;" />
         <p style="position:absolute;left:32%;top:20%;font-size:120%;">{{thema.uname}}</p>
         <h6 style="position:absolute;left:32%;top:55%;font-size:70%">本项目由WRQ开发,且开源于<a href="https://github.com/AllenYeka/ChatGPT-QWeb.git">GitHub</a></h6>
      </div>
   </div>
</template>


<script setup>
import { ref, reactive, onMounted, onBeforeMount } from 'vue'
import emitter from '../utils/event-bus'
import { ElMessage } from "element-plus"
/* data */
let chats = reactive([{ id: 1, content: '和傲娇女友聊天', saveIcon: false, editIcon: true, renameInput: false }])
let thema = reactive({//主题
   uname: '胡桃',
   newChatClass: 'newChat'
})
let elShowIf = reactive({//部分元素的显示与否
   chatDot: true,
   deleteFilled: true
})



/* method */
function newChat() {//新建聊天框
   if (chats.length == 8)
      ElMessage.error({ message: '聊天数超过上限' })
   else {
      chats.push({ id: chats.length + 1, content: '新的聊天', saveIcon: false, editIcon: true, renameInput: false })
      emitter.emit('newChatId', chats[chats.length - 1].id)
      localStorage.setItem('chats', JSON.stringify(chats))
      ElMessage.success({ message: '新建成功', duration: 700 })
   }
}
function deleteChat(chat) {//删除聊天框
   if (chat.id == 1)
      ElMessage.warning({ message: '无法删除', duration: 500 })
   else {
      chats.splice(chats.indexOf(chat), 1)
      for (var i = chat.id - 1; i < chats.length; i++)
         chats[i].id = i + 1
      localStorage.setItem('chats', JSON.stringify(chats))
      emitter.emit('delChatId', chat.id)
      ElMessage.success({ message: '删除成功', duration: 500 })
   }
}
function renameChat(chat) {
   chat.saveIcon = true
   chat.editIcon = false
   chat.renameInput = true
}
function saveName(chat) {
   chat.saveIcon = false
   chat.editIcon = true
   chat.renameInput = false
   localStorage.setItem('chats', JSON.stringify(chats))
}
function sendChatId(chatId, el) {//更改聊天记录集chatId
   emitter.emit('chatId', chatId)
   let chatThema = { color: '', boxshadow: '' }
   if (thema.uname == '纳西妲')
      chatThema.color = 'lightgreen'
   else if (thema.uname == '神里绫华')
      chatThema.color = 'lightblue'
   else if (thema.uname == '胡桃')
      chatThema.color = 'rgba(255, 0, 0, 0.886)'
   let chatboxs = document.getElementsByClassName('chats')[0].getElementsByTagName('div')
   for (let i = 0; i < chatboxs.length; i++)
      chatboxs[i].style.color = ''
   el.style.color = chatThema.color
}
function windowResize() {//window窗口变化时的回调函数
   /* chatBox的显示与隐藏 */
   if (window.innerWidth < 935) {
      document.getElementsByClassName('chatBox')[0].style.width = '0%'
      emitter.emit('chatBoxShow', 'hidden')
   }
   else {
      document.getElementsByClassName('chatBox')[0].style.width = '22%'
      emitter.emit('chatBoxShow', 'show')
   }
}
function mobileInit() {//移动端初始化
   let chatsEl = document.getElementsByClassName('chats')[0]
   if (window.innerWidth < 935) {
      document.getElementsByClassName('chatBox')[0].style.width = '0%'
      emitter.emit('chatBoxShow', 'hidden')
   }
}
function LingHua() {
   let pictureNumber = Math.floor(Math.random() * 2) + 1
   let imgsrc = "url('src/assets/linghua/l1-" + pictureNumber + ".jpg') 0px 0px/cover"
   document.getElementsByClassName('chatBox')[0].style.background = imgsrc
   document.getElementsByClassName('userInfo')[0].getElementsByTagName('img')[0].src = "src/assets/linghua/l2.jpg"
   document.getElementsByClassName('userInfo')[0].getElementsByTagName('a')[0].style.color = 'blue'
   document.getElementsByClassName('userInfo')[0].style.borderTop = '1px blue solid'
   thema.newChatClass = 'newChat_blue'
   thema.uname = '神里绫华'
}
function NaXiDa() {
   let pictureNumber = Math.floor(Math.random() * 3) + 1
   let imgsrc = "url('src/assets/naxida/n1-" + pictureNumber + ".jpg') 0px 0px/cover"
   document.getElementsByClassName('chatBox')[0].style.background = imgsrc
   document.getElementsByClassName('userInfo')[0].getElementsByTagName('img')[0].src = "src/assets/naxida/n5.jpg"
   document.getElementsByClassName('userInfo')[0].getElementsByTagName('a')[0].style.color = 'green'
   document.getElementsByClassName('userInfo')[0].style.borderTop = '1px green solid'
   thema.newChatClass = 'newChat_green'
   thema.uname = '纳西妲'
}
function HuTao() {
   let pictureNumber = Math.floor(Math.random() * 3) + 1
   let imgsrc = "url('src/assets/hutao/h1-" + pictureNumber + ".jpg') 0px 0px/cover"
   document.getElementsByClassName('chatBox')[0].style.background = imgsrc
   document.getElementsByClassName('userInfo')[0].getElementsByTagName('img')[0].src = "src/assets/hutao/h2.jpg"
   document.getElementsByClassName('userInfo')[0].getElementsByTagName('a')[0].style.color = 'red'
   document.getElementsByClassName('userInfo')[0].style.borderTop = '1px red solid'
   thema.newChatClass = 'newChat'
   thema.uname = '胡桃'
}


/* 钩子 */
onBeforeMount(() => {
   if (localStorage.getItem('chats') != null)
      chats = reactive(JSON.parse(localStorage.getItem('chats')))
})
onMounted(() => {
   emitter.on('thema', (val) => {//主题
      if (val == '蓝色')
         LingHua()
      else if (val == '绿色')
         NaXiDa()
      else
         HuTao()
   })
   emitter.on('chatboxExpand', (val) => {
      if (val == 'expand')//chatBox展开时
         document.getElementsByClassName('chatBox')[0].style.width = '80%'
      else//chatBox闭合时
         document.getElementsByClassName('chatBox')[0].style.width = '0%'
   })
   window.addEventListener('resize', () => { windowResize() })
   mobileInit()//移动端
})

</script>


<style scoped lang="less">
@import '../myStyle/chatBox/blue.less';//蓝色主题
@import '../myStyle/chatBox/green.less';//绿色主题
.userInfo {
   width: 90%;
   height: 12%;
   border-top: 1px red solid;
   box-sizing: border-box;
   overflow: hidden;
   position: relative;
}
.chats {
   width: 90%;
   height: 72%;
   display: flex;
   flex-wrap: wrap;
   justify-content: center;
   align-content: flex-start;
   div {
      width: 90%;
      height: 10%;
      border: 1px solid rgba(0, 0, 0, 0.53);
      margin-bottom: 5%;
      border-radius: 10px;
      transition: all 0.4s;
      font-size: 15px;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      overflow: hidden;
      cursor: default;
   }
   div:hover {
      transform: translate(0px, -3px);
      box-shadow: 0px 5px 10px rgba(128, 128, 128, 0.484);
   }
}
.newChat {
   width: 90%;
   height: 7%;
   border: grey dashed 1px;
   border-radius: 3%;
   background: none;
   font-size: 20px;
   color: grey;
   transition: all 0.4s;
   margin-top: 5%;
   overflow: hidden;
   &:hover {
      color: rgba(255, 0, 0, 0.886);
      border: red dashed 1px;
   }
}
.chatBox {
   width: 22%;
   height: 100%;
   opacity: 0.7;
   background: url(../assets/hutao/h1-1.jpg) 0px 0px / cover;
   border-right: 1px solid rgba(128, 128, 128, 0.467);
   box-sizing: border-box;
   display: flex;
   flex-wrap: wrap;
   justify-content: center;
   overflow: hidden;
   transition: all 0.4s;
}
</style>