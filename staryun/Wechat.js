/**
 * 微信通知
 * Created by Administrator on 2018/10/11.
 */
const superagent = require('superagent');//远程调用
const staryun = require('./staryun');//远程调用

//测试公众号信息
const appId = 'wx11add28a0e0bfc25';
const appsecret = '03e1ffe4a58aefc3e98e23a77fd47b52';

let accessToken = '';
let userOpenId = '';
let templateId = '';

/**
 * 获取access_token
 */
const getAccessToken = function () {
    superagent.get('https://api.weixin.qq.com/cgi-bin/token')
        .query({grant_type: 'client_credential'})
        .query({appid: appId})
        .query({secret: appsecret})
        .end((error, response) => {
            if (response.ok) {
                accessToken = response.body.access_token;
                getAllUser();
            } else {
                console.log(' get access_token error ');
            }
        });
};

/**
 * 获取所有用户信息
 */
const getAllUser = function () {
    superagent.get('https://api.weixin.qq.com/cgi-bin/user/get')
        .query({access_token: accessToken})
        .query({next_openid: ''})
        .end((error, response) => {
            if (response.ok) {
                console.log(response.body);
                userOpenId = response.body.data.openid[0];
                getTemplateList();
            } else {
                console.log(' get all user openid error ');
            }
        });
};

/**
 * 获取所有模板
 */
const getTemplateList = function () {
    superagent.get('https://api.weixin.qq.com/cgi-bin/template/get_all_private_template')
        .query({access_token: accessToken})
        .end((error, response) => {
            if (response.ok) {
                templateId = response.body.template_list[0].template_id;
                sendTemplate();
            } else {
                console.log(' get template list error ');
            }
        });
};
/**
 * 模板参数
 */
let templateParams = {
    'touser': '',
    'template_id': '',
    'data': {
        'nowData': {
            'value': '',
            'color': '#173177'
        },
        'nowGetFlow': {
            'value': '',
            'color': '#173177'
        },
        'usedFlow': {
            'value': '',
            'color': '#173177'
        },
        'remainingFlow': {
            'value': '',
            'color': '#173177'
        }
    }
};

/**
 * 发送模板消息
 */
const sendTemplate = function () {
    templateParams.touser = userOpenId;
    templateParams.template_id = templateId;
    const flowParams = staryun.flowParams;

    const date = new Date();
    templateParams.data.nowData = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    templateParams.data.nowGetFlow.value = flowParams.nowGetFlow;
    templateParams.data.usedFlow.value = flowParams.usedFlow;
    templateParams.data.remainingFlow.value = flowParams.remainingFlow;

    superagent.post('https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=' + accessToken)
        .send(templateParams)
        .end((error, response) => {
            if (response.ok) {
                console.log(' send template message success ');
            } else {
                console.log(' send template message error ');
            }
        });
};

exports.sendWechatMessage = function () {
    console.log(' start send template message ... ');
    getAccessToken();
    console.log(' end send template message ... ');
};