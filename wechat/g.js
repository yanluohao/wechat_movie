'use strict'

var sha1 = require("sha1");
var promise = require("bluebird");
var request = promise.promisify(require("request"));
var getRawBody=require("raw-body");
var util=require("../libs/util");

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

    this.getAccessToken()
        .then(
            function (data) {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    return that.updateAccessToken();
                }

                if (that.isValidAccessToken(data)) {
                    return promise.resolve(data);
                } else {
                    return that.updateAccessToken();
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

Wechat.prototype.updateAccessToken = function () {
    var appID = this.appID;
    var appSecret = this.appSecret;
    var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret;
    return new Promise(function (resolve, reject) {
        //向url发出请求
        request({
            url: url,
            json: true
        }).then(function (response) {
            console.log(response.body);
            var data = response.body;
            var now = new Date().getTime();
            //票据提前20秒刷新
            var expires_in = now + (data.expires_in - 20) * 1000;
            data.expires_in = expires_in;

            resolve(data);
        })
    })
}



module.exports = function (opts,handler) {
    var wechat = new Wechat(opts);

    return function* (next) {
        var token = opts.token;
        var signature = this.query.signature;
        var nonce = this.query.nonce;
        var timestamp = this.query.timestamp;
        var echostr = this.query.echostr;
        var str = [token, timestamp, nonce].sort().join(''); //按字典排序，拼接字符串
        var sha = sha1(str); //加密
        // this.body = (sha === signature) ? echostr + '' : 'failed';
        if (sha === signature) {
            this.body = echostr + '';
        } else {
            this.body = 'wrong';
        }

        if(this.method==="GET"){

        }else if(this.method==="POST"){
            if(sha!==signature){
                this.body="wrong !出问题了";
                return false;
            }
            //通过raw-body模块把this上的request对象拼装数据，最终拿到一个buffer的xml数据
            var data=yield getRawBody(this.req,{
                // length:this.length,
                limit:'1mb',
                encoding:this.charset
            })
            //xml转json
            var content=yield util.parseXMLAsync(data);

            var message=util.formatMessage(content.xml);

            console.log(message);
            //handler是从app.js传进来的wxUtil.reply方法，也就是回复的代码部分
            yield handler.call(this,next);

            wechat.reply.call(this);
        }
    }
}