<template>
  <div>
    <!-- 查询栏 -->
    <div class="pl-60 h-70 border-2 bg-white hover:shadow-md">
      <el-form class="grid grid-cols-2 p-5">
        <el-form-item label-width="80" label="年级：">
          <el-input
            v-model="courseStore.courses.grade"
            disabled
            class="w-40%"
            placeholder="请输入年级"
          />
        </el-form-item>
        <el-form-item label-width="80" label="学院：">
          <el-input
            v-model="courseStore.courses.college"
            disabled
            class="w-40%"
            placeholder="请输入学院"
          />
        </el-form-item>
        <el-form-item label-width="80" label="专业：">
          <el-input
            v-model="courseStore.courses.major"
            disabled
            class="w-40%"
            placeholder="请输入专业"
          />
        </el-form-item>
        <el-form-item label-width="80" label="课程：">
          <el-input
            v-model="courseStore.courses.course"
            disabled
            class="w-40%"
            placeholder="请输入课程"
          />
        </el-form-item>
        <el-form-item label="设置时长：">
          <div class="h-10 flex">
            <el-input-number v-model="minutes" :min="1" :max="10" />
            <p class="ml-2 mt-1 text-4 text-gray-6">分钟</p>
          </div>
        </el-form-item>
      </el-form>

      <div class="absolute left-260 top-70">
        <el-button
          @click="releaseClick"
          :disabled="addressStore.timeInSeconds > 0"
          class="text-white bg-indigo shadow-sm hover:bg-indigo-5 hover:text-white"
        >
          发布签到
          <div id="countDownTime" v-if="addressStore.timeInSeconds > 0">
            ({{ timeInSeconds }})
          </div>
        </el-button>
      </div>
    </div>

    <!-- 签到情况栏 -->
    <div class="mt-10 border-2 bg-white shadow-sm hover:shadow-md">
      <div class="w-150 h-100 ml-115" id="echarts"></div>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from "../../store/userStore";
import { useCourseStore } from "../../store/courseStore";
import { useAddressStore } from "../../store/addressStore";
import noticeApi from "../../api/mothod/notice";
import { formateDate } from "../../utils/formateDate";
import { findAllCourse } from "./utils/findCourseAll";
import * as echarts from "echarts";
import { ref, onMounted, computed, watchEffect, watch } from "vue";
import { ElMessage } from "element-plus";

const userStore = useUserStore();
const courseStore = useCourseStore();
const addressStore = useAddressStore();

//表单时间
const minutes = ref(1); //设置时长
const timeInSeconds = computed(() => {
  return addressStore.timeInSeconds > 0 ? addressStore.timeInSeconds : minutes.value * 60;
}); //将时长换算成秒

//发布签到
const releaseClick = async () => {
  const { data } = await noticeApi.setRedis({
    grade: courseStore.courses.grade,
    major: courseStore.courses.major,
    college: courseStore.courses.college,
    courseId: courseStore.courses.id,
    duration: minutes.value,
    teacherCard: userStore.users.teacher.teacherCard
  });
  if (data.code === 200) {
    ElMessage.success("发布成功!");
    
    addressStore.setTimeInSeconds(timeInSeconds.value);
    addressStore.countDownAction();
  } else {
    ElMessage.error(data.msg);
  }
};

//考勤各情况总数
const attendanceCount = ref({
  notSignInCount: 0,
  signInCount: 0,
  absenceCount: 0,
});

//获取考勤各情况信息
const attendanceConditions = async () => {
  //未签到情况
  const notSignIn = await noticeApi.getNotSignInStudentList({
    teacherCard: userStore.users.teacher.teacherCard,
    grade: courseStore.courses.grade,
    college: courseStore.courses.college,
    major: courseStore.courses.major,
    class: courseStore.courses.class,
    courseId: courseStore.courses.id,
    createTime: formateDate(new Date()),
    status: 1
  });
  // console.log(notSignIn.data.data.studentList);
  if (notSignIn.data.code === 200) {
    attendanceCount.value.notSignInCount = notSignIn.data.data.studentList.length;
  }
  //签到情况
  const signIn = await noticeApi.getSignInAndAbsenceList({
    teacherCard: userStore.users.teacher.teacherCard,
    grade: courseStore.courses.grade,
    college: courseStore.courses.college,
    major: courseStore.courses.major,
    class: courseStore.courses.class,
    courseId: courseStore.courses.id,
    createTime: formateDate(new Date()),
    status: 1,
  });
  console.log(signIn.data.data.recordResp);
  if (signIn.data.code === 200) {
    attendanceCount.value.signInCount = signIn.data.data.totalCount;
  }

  //缺勤情况
  const absence = await noticeApi.getSignInAndAbsenceList({
    teacherCard: userStore.users.teacher.teacherCard,
    grade: courseStore.courses.grade,
    college: courseStore.courses.college,
    major: courseStore.courses.major,
    class: courseStore.courses.class,
    courseId: courseStore.courses.id,
    createTime: formateDate(new Date()),
    status: 2,
  });
  console.log(signIn.data.data.recordResp);
  if (absence.data.code === 200) {
    attendanceCount.value.absenceCount = absence.data.data.totalCount;
  }
};

//计算属性饼状图数据
const data = computed(() => ({
  title: "考勤情况",
  names: ["未签到", "签到", "缺勤"],
  values: [
    { name: "未签到", value: attendanceCount.value.notSignInCount },
    { name: "签到", value: attendanceCount.value.signInCount },
    { name: "缺勤", value: attendanceCount.value.absenceCount },
  ],
}));

//侦听
watchEffect(() => {
  attendanceConditions();
});

//饼状图
const drawPie = () => {
  // 用Promise方法让dom加载后再去获取dom,否则dom还没加载的时候，echarts.init() 就已经开始执行就会报错
  let newPromise = new Promise((resolve) => {
    resolve();
  });

  newPromise.then(() => {
    //如果存在DOM，就会报存在警告，删除DOM
    echarts.dispose(document.getElementById("echarts"));

    //创建一张饼图表
    let charts = echarts.init(document.getElementById("echarts"));
    charts.setOption({
      title: {
        text: "考勤情况",
        left: "center",
        top: 20,
      },
      color: ["#fdba74", "#86efac", "#fca5a5"],
      // 鼠标划过时饼状图上显示的数据
      tooltip: {
        trigger: "item",
        formatter: "{a} <br /> {b} :{c} ({d}%)",
      },
      //图例
      legend: {
        top: 50,
        left: 5,
        data: data.value.names,
        orient: "vertical", //名字显示的位置，默认横向
      },
      series: [
        {
          name: data.value.title,
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          selectedMode: "single",
          data: data.value.values,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgda(0, 0, 0, 0.5)",
            },
          },
        },
      ],
      label: {
        show: true,
        formatter: "{b}: {d}%",
        fontSize: "18px",
      },
    });
    window.addEventListener("resize", function () {
      charts.resize();
    });
  });
};

//每隔一段时间检查数据库数据的变化
const refresh = () => {
  setInterval(async () => {
    await attendanceConditions();
  }, 30000);
};

watchEffect(() => {
  drawPie(data.value.values);
});

onMounted(async () => {
  findAllCourse();
  drawPie();
  attendanceConditions();
  refresh();
});
</script>
