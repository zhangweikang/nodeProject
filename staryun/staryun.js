/**
 * Staryun
 * 自动登录
 * 自动领取流量
 * 自动退出登录
 * Created by Administrator on 2018/10/11.
 */
const Wechat = require('./Wechat'); //引入微信发送消息模块

const superagent = require('superagent'); //远程调用
const events = require('events'); //事件
const request = require('request');
const cheerio = require('cheerio');

const urls = [{
        domain: 'https://staryun.me',
        name: '星之所在'
    },
    {
        domain: 'https://wxkxsw.com',
        name: '我想开心上网'
    }
]

let paramsIndex = 0;
let requestParams = urls[paramsIndex];

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
    superagent.post(requestParams.domain + '/auth/login').send(loginParams).end((error, response) => {
        if (error) {
            console.error(requestParams.domain + ' error ' + error);
            return false;
        }
        if (response.ok) {
            console.log(' staryun login success ');
            console.log(' login response body :' + decodeUnicode(response.text));
            getCookie(response.headers['set-cookie']);
            //成功后触发签到功能
            eventEmitter.emit('signIn');
        } else {
            console.log(' staryun login error ');
            errorOrOut();
        }
    });
};
//创建签到方法
const signIn = function () {
    console.log(' staryun start signIn');
    superagent.post(requestParams.domain + '/user/checkin')
        .set('Cookie', cookies)
        .end((error, response) => {
            if (error) {
                console.error(requestParams.domain + ' error ' + error);
                return false;
            }
            if (response.ok) {
                try{
                    console.log(' staryun signIn success');
                    let responseData = decodeUnicode(response.text);
                    console.log(' signIn response body :' + responseData);
                    responseData = JSON.parse(responseData);
                    flowParams.nowGetFlow = responseData.msg;
                    //成功后触发签到功能
                    eventEmitter.emit('sendMessage');
                } catch (error){
                    console.error(requestParams.domain + ' error ' + response.text);
                    console.error(' error ' + error);
                    errorOrOut();
                }
                
            } else {
                console.log(' staryun signIn error ');
                errorOrOut();
            }
        });
};
//创建退出登录方法
const logout = function () {
    console.log(' staryun start logout');
    request(requestParams.domain + '/user/logout', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(' staryun logout success ');
            errorOrOut();
        }
    });
};
/**
 * 解析html获取用户流量数据
 */
const getUserHtmlData = function () {
    superagent.get(requestParams.domain + '/user')
        .set('Cookie', cookies)
        .set('Accept', '*/*')
        .end((error, response) => {
            if (error) {
                console.error(requestParams.domain + ' error ' + error);
                return false;
            }
            if (response.ok) {
                const $ = cheerio.load(response.text);
                const scripts = $('script');
                scripts.each(function (index, object) {
                    let html = $(this).html().replace(/\s+/g, "");
                    if (html.indexOf('newCanvasJS.Chart("traffic_chart"') > 0) {
                        const objectBeginIndex = html.indexOf('{');
                        const objectEndIndex = html.lastIndexOf('}');
                        html = html.substring(objectBeginIndex, objectEndIndex + 1);
                        let htmlObject = eval('(' + html + ')');
                        flowParams.usedFlow = htmlObject.data[0].dataPoints[1].legendText;
                        flowParams.remainingFlow = htmlObject.data[0].dataPoints[2].legendText;

                        Wechat.sendWechatMessage(requestParams.name);

                        cookies = '';
                        eventEmitter.emit('logout');

                        return false;
                    }
                });
            } else {
                errorOrOut();
                console.log(' staryun getHtml error ');
            }
        });
};

// 绑定 登录 事件处理程序
eventEmitter.on('login', login);
// 绑定 签到 事件处理程序
eventEmitter.on('signIn', signIn);
// 绑定 发送消息 事件处理程序
eventEmitter.on('sendMessage', getUserHtmlData);
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
//失败或者退出登陆的时候出发下一个域名亲登陆签到或者还原坐标
const errorOrOut = function () {
    if (urls.length - 1 > paramsIndex) {
        paramsIndex++;
        requestParams = urls[paramsIndex];

        console.log(' 触发 ' + requestParams.domain + '登陆')
        eventEmitter.emit('login');
    } else {
        paramsIndex = 0;
        requestParams = urls[paramsIndex];
    }
}

exports.flowParams = flowParams;
exports.main = function () {
    // 触发 登录 事件
    eventEmitter.emit('login');
};