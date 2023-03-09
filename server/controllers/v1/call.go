package controllersV1

import (
	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/methods"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"
	"github.com/cherrai/nyanyago-utils/validation"
	"github.com/gin-gonic/gin"
)

type CallController struct {
}

func (fc *CallController) VerifyCallToken(c *gin.Context) {
	// 1、请求体
	var res response.ResponseType
	res.Code = 200

	data := struct {
		AppId  string
		AppKey string
		Uid    string
		RoomId string
		Token  string
	}{
		AppId:  c.PostForm("appId"),
		AppKey: c.PostForm("appKey"),
		Uid:    c.PostForm("uid"),
		RoomId: c.PostForm("roomId"),
		Token:  c.PostForm("token"),
	}

	// 2、获取参数
	var err error
	// 3、验证参数

	if err = validation.ValidateStruct(
		&data,
		validation.Parameter(&data.AppId, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.AppKey, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Uid, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.RoomId, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Token, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}
	log.Info(data.AppId, data.AppKey)
	if !methods.CheckApp(data.AppId, data.AppKey) {
		res.Code = 10017
		res.Call(c)
		return
	}
	// log.Info(data.AppId, data.Uid, data.Token)

	rKey := conf.Redisdb.GetKey("SFUCallToken")
	// log.Info(rKey, data.AppId+data.Uid)
	// fc20c5cc-c567-50e8-90fc-5a0eb1ed6316100000
	v, err := conf.Redisdb.Get(rKey.GetKey(data.AppId + data.RoomId + data.Uid))

	log.Info("v", v, err, data.Token)
	if err != nil || v.String() != data.Token {
		res.Errors(err)
		res.Code = 10203
		res.Call(c)
		return
	}
	// conf.Redisdb.Delete(rKey.GetKey(data.AppId + data.RoomId + data.Uid))

	res.Code = 200

	res.Call(c)
}
