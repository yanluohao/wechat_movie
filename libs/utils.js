'use strict'

var fs = require("fs");
// var Promise=require("bluebird");
var xml2js = require("xml2js");
var  tpl=require("./tpl");



exports.readFileAsync = function (fpath, encoding) {
    return new Promise(function (resolve, reject) {
        //readFile和readFileSync的区别在于
        //readFile可以采用回调函数，不影响程序阻塞，适合文件较大的读取
        //readFileSync适合小文件，顺序执行
        fs.readFile(fpath, encoding, function (err, content) {
            if (err) reject(err);
            else resolve(content);
        })
    })
}

exports.writeFileAsync = function (fpath, content) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(fpath, content, function (err, content) {
            if (err) reject(err);
            else resolve(content);
        })
    })
}

// XML转换成json数据
exports.parseXMLAsync = function (xml) {
    return new Promise(function (resolve, reject) {
        xml2js.parseString(xml, {
            trim: true
        }, function (err, content) {
            if (err) reject(err)
            else resolve(content);
        })
    })
}

//json对象解析为js对象
exports.formatMessage=function(result){
    var message={};
    if(typeof(result)==='object'){
        var keys=Object.keys(result);   //枚举返回的result自身属性名组成的数组
        for(let i=0,len=keys.length;i<len;i++){
            var key=keys[i];
            var item=result[key];
            if(!(item instanceof Array)||item.length==0){
                continue;
            }
            if(item.length===1){
                var val=item[0];
                if(typeof val==='object'){
                    message[key]=formatMessage(val);
                }else{
                    message[key]=(val||'').trim();
                }
            }else{
                //item长度大于1的情况下
                message[key]=[];
                for(let j=0;j<item.length;j++){
                    message[key].push(formatMessage(item[j]));
                }
            }
        }
    }
    return message;
}

//生成回复消息模板
exports.tpl=function(content,message){
    //用来存储要回复的内容
    var info={};
    var type="text";
    var fromUserName=message.FromUserName;
    var toUserName=message.ToUserName;
    //如果是图文标示
    if(Array.isArray(content)){
        type='news';
    }
    type=content.type||type;
    info.content=content;
    info.createTime=new Date().getTime();
    info.msgType=type;
    
}