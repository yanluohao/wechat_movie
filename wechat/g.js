'use strict'

var sha1 = require("sha1");
var promise = require("bluebird");
var request = promise.promisify(require("request"));
var getRawBody=require("raw-body");
var util=require("../libs/utils");

// app.use(static(__dirname + '/www'));
//接口配置信息的url必须指向当前app.js文件，负责无法配置成功


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
            // yield handler.call(this,next);
            if(message.MsgType==='event'){
                if(message.Event==='subscribe'){
                    this.body=`新来的${message.FromUserName}你好哦`;
                }
            }else if(message.MsgType==='text'){
                if(message.Content='1'){
                    this.body=`你好啊${message.FromUserName}`;
                }
            }

            // wechat.reply.call(this);
        }
    }
}