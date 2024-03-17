import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElIcon from '@element-plus/icons-vue'

const app=createApp(App)
app.use(ElementPlus)
Object.keys(ElIcon).forEach((key) => {
    app.component(key, ElIcon[key])
})
app.mount('#app')