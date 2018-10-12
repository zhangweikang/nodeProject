/**
 * Staryun
 * 自动登录
 * 自动领取流量
 * 自动退出登录
 * Created by Administrator on 2018/10/11.
 */
const Wechat = require('./Wechat');//引入微信发送消息模块

const superagent = require('superagent');//远程调用
const events = require('events');//事件
const request = require('request');
const cheerio = require('cheerio');

let cookies = '';
const loginParams = {
    email: 'zhangweikang0929@gmail.com',
    passwd: 'z12345678',
    code: '',
    remember_me: ''
};

let flowParams = {
    nowGetFlow: '',
    usedFlow: '',
    remainingFlow: ''
};

// 创建 eventEmitter 对象
const eventEmitter = new events.EventEmitter();

// 创建登录方法
const login = function () {
    console.log(' staryun start login');
    superagent.post('https://staryun.me/auth/login').send(loginParams).end((error, response) => {
        if (response.ok) {
            console.log(' staryun login success');
            console.log(' login response body :' + decodeUnicode(response.text));
            getCookie(response.headers['set-cookie']);
            //成功后触发签到功能
            eventEmitter.emit('signIn');
        } else {
            console.log(' staryun login error');
        }
    })
};
//创建签到方法
const signIn = function () {
    console.log(' staryun start signIn');
    superagent.post('https://staryun.me/user/checkin')
        .set('Cookie', cookies)
        .end((error, response) => {
            if (response.ok) {
                console.log(' staryun signIn success');
                let responseData = decodeUnicode(response.text);
                console.log(' signIn response body :' + responseData);
                responseData = JSON.parse(responseData);
                flowParams.nowGetFlow = responseData.msg;
                getUserHtmlData();//解析页面用户流量数据
                //成功后触发签到功能
                eventEmitter.emit('logout');
            } else {
                console.log(' staryun signIn error');
            }
        });
};
//创建退出登录方法
const logout = function () {
    console.log(' staryun start logout');
    request('https://staryun.me/user/logout', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(' staryun logout success');
            Wechat.sendWechatMessage();
        }
    });
};

// 绑定 登录 事件处理程序
eventEmitter.on('login', login);
// 绑定 签到 事件处理程序
eventEmitter.on('signIn', signIn);
// 绑定 退出登录 事件处理程序
eventEmitter.on('logout', logout);

// Unicode解码
const decodeUnicode = function (str) {
    if (str) {
        str = str.replace(/\\/g, '%');
        str = unescape(str);
        return str.replace(/%/g, '');
    } else {
        return '';
    }
};
//解析Cookie
const getCookie = function (cookieData) {
    for (let i = 0; i < cookieData.length; i++) {
        (function (e) {
            const splits = cookieData[e].split(';');
            cookies += splits[0] + ';';
        })(i);
    }
};

/**
 * 解析html获取用户流量数据
 */
const getUserHtmlData = function () {
    superagent.get('https://staryun.me/user')
        .set('Cookie', cookies)
        .set('Accept', '*/*')
        .end((error, response) => {
            if (response.ok) {
                const $ = cheerio.load(response.text);
                const scripts = $('script');
                const canvasJSParams = eval('(' + $(scripts[2]).html().substring(74, 1347) + ')');
                flowParams.usedFlow = canvasJSParams.data[0].dataPoints[1].legendText;
                flowParams.remainingFlow = canvasJSParams.data[0].dataPoints[2].legendText;
            } else {
                console.log(' staryun signIn error');
            }
        });
};

exports.flowParams = flowParams;
exports.main = function () {
    // 触发 登录 事件
    eventEmitter.emit('login');
};