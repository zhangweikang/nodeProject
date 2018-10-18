/**
 * 程序启动入口
 * Created by Administrator on 2018/10/12.
 */
const schedule = require('node-schedule'); //定时任务
const staryun = require('./staryun'); //引入staryun模块

//定时任务
const scheduleCronstyle = function () {
    //每天凌晨15分自动触发
    schedule.scheduleJob('0 15 * * * *', function () {
        staryun.main();
    });
};

scheduleCronstyle();