var koa = require("koa");
var wechat = require("./wechat/g");
var path = require("path");
var util = require("./libs/util");
var wechat_file = path.join(__dirname, './config/wechat.txt');

var app = koa();
var port = 80;

var config = {
	wechat: {
		appID: 'wx544bdb3ac9dac85b',
		appSecret: 'a1db2a11bda2f8bdb3f87911787d9728',
		token: 'yanluohao1',
		getAccessToken: function () {
			return util.readFileAsync(wechat_file);
		},
		saveAccessToken: function (data) {
			data=JSON.stringify(data)
			return util.writeFileAsync(wechat_file,data);
		}
	}
}

app.use(wechat(config.wechat));



app.listen(port, () => {
	console.log(`server run on ${port}`);
})


//  _9zcFtYQHKamHgNkZGQ71gmQTI3qQKh-2Zax6q5V4DbJYNb-B5JvjpJIXYvLpWqM_C6153qkUdYeYJvIby70JAV2MIOsjWeuy7_jI3uS_rXcszuDsB3GC9jdWmdVFtceSZOcACAVCR       access_token