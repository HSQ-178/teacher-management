<template>
    <div>
        <div class="w-full relative h-10 bg-white">
            <div class="absolute left-15% top-18% text-xl text-gray-5">
                <div>清榕小课堂</div>
            </div>
            <div class="absolute right-10% top-18%" v-if="loggedInDisplay">
              <a href="/register" class="mr-4">注册</a>
              <a href="/login">登录</a>
            </div>
            
            <div class="logged-in" v-if="loggedOutDisplay">
                    <el-button @click="loggedOff" color="red" class="absolute right-10% top-10%">
                        安全退出
                    </el-button>
            </div>
        </div>
        <div class="flex">
            <div>
                <LeftTabbar></LeftTabbar>
            </div>
            <div class="w-80% ml-4 mt-5">
                <router-view></router-view>
            </div>
        </div>
        
    </div>
</template>

<script setup>
import LeftTabbar from '../../components/LeftTabbar.vue';
import { useUserStore } from '../../store/userStore';
import router from '../../router/router'
import { onMounted } from "vue"

const userStore = useUserStore()

const loggedInDisplay = computed(() => {
    return userStore.users.teacher.teacherCard == '' || userStore.users.teacher.name == ''
})
const loggedOutDisplay = computed(() => {
    return userStore.users.teacher.teacherCard != '' && userStore.users.teacher.name != ''
})

//安全退出
const loggedOff = () => {
    setTimeout(() => {
        //清空
        userStore.clear()
        router.push('/login')
    }, 1000);
}

// onMounted(() => {
//     console.log(userStore.users);
// })

</script>

<style scoped>

</style>