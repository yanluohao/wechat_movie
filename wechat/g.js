'use strict'

var sha1 = require("sha1");
var promise = require("bluebird");
var request = promise.promisify(require("request"));

// app.use(static(__dirname + '/www'));
//接口配置信息的url必须指向当前app.js文件，负责无法配置成功

var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var api = {
    accessToken: prefix + 'token?grant_type=client_credential'
}

function Wechat(opts) {
    var that = this;
    this.appID = opts.appID;
    this.appSecret = opts.appSecret;
    this.getAccessToken = opts.getAccessToken;
    this.saveAccessToken = opts.saveAccessToken;

    console.log(opts,1);

    this.getAccessToken()
        .then(
            function (data) {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    return that.updateAccessToken(data);
                }

                if (that.isValidAccessToken(ata)) {
                    resolve(data);
                } else {
                    return that.updateAccessToken(data);
                }
            }
        )
        .then(function (data) {
            that.access_token = data.access_token;
            that.expires_in = data.expires_in;

            that.saveAccessToken(data);
        })
}

Wechat.prototype.isValidAccessToken = function (data) {
    if (!data || !data.access_token || !data.expires_in) {
        return false;
    }

    var access_token = data.access_token;
    var expires_in = data.expires_in;
    var now = (new Date().getTime())

    if (now < expires_in) {
        return true;
    } else {
        return false;
    }
}

Wechat.prototype.updateAccessToken = function (data) {
    var appID = this.appID;
    var appSecret = this.appSecret;
    var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret;
    return new Promise(function (resolve, reject) {
        request({
            url: url,
            json: true
        }).then(function (response) {
            var data = response[1];
            var now = (new Date().getTime());
            var expires_in = now + (data.expires_in - 20) * 1000 //让票据提前二十秒刷新
            data.expires_in = expires_in;

            resolve(data);
        })
    })
}



module.exports = function (opts) {
    // var wechat=new Wechat(opts);

    return function* (next) {
        var token = opts.token;
        var signature = this.query.signature;
        var nonce = this.query.nonce;
        var timestamp = this.query.timestamp;
        var echostr = this.query.echostr;
        var str = [token, timestamp, nonce].sort().join(''); //按字典排序，拼接字符串
        var sha = sha1(str); //加密
        // this.body = (sha === signature) ? echostr + '' : 'failed';
        console.log(sha, signature, nonce);
        // console.log(this,2);
        if (sha === signature) {
            this.body = echostr + '';
        } else {
            this.body = 'wrong';
        }
    }
}