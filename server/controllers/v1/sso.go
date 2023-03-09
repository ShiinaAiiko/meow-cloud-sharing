package controllersV1

import (
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"

	"github.com/cherrai/nyanyago-utils/validation"
	"github.com/gin-gonic/gin"
)

type SSOController struct {
}

// 生成SSOAppToken
func (ac *SSOController) CreateAppToken(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、获取参数
	data := new(protos.CreateAppToken_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}

	// 3、验证参数
	err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.AppId, validation.Type("string"), validation.Required()),
	)
	if err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}

	// ua, exists := c.Get("userAgent")
	// if !exists {
	// 	res.Error = "UserAgent does not exist."
	// 	res.Code = 10002
	// 	res.Call(c)
	// }
	// userAgent := ua.(*sso.UserAgent)
	// token := c.GetString("token")
	// deviceId := c.GetString("deviceId")

	// // 4、校验登录
	// t, err := conf.GetSSO(data.AppId).AnonymousUser.GetAppToken(token, deviceId, userAgent)

	// if err != nil || t == nil || t.Token == "" {
	// 	res.Errors(err)
	// 	res.Code = 10018
	// 	res.Call(c)
	// 	return
	// }
	// 6、合并用户数据

	// responseData := protos.CreateAppToken_Response{
	// 	Token:      t.Token,
	// 	CreateTime: t.CreateTime,
	// }

	// res.Data = protos.Encode(&responseData)
	res.Call(c)
}

func (ac *SSOController) VerifyAppToken(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、获取参数
	data := new(protos.CreateAppToken_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}

	// 3、验证参数
	err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.AppId, validation.Type("string"), validation.Required()),
	)
	if err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}

	// ua, exists := c.Get("userAgent")
	// if !exists {
	// 	res.Error = "UserAgent does not exist."
	// 	res.Code = 10002
	// 	res.Call(c)
	// }
	// userAgent := ua.(*sso.UserAgent)
	// // 4、校验登录
	// t, err := conf.GetSSO(data.AppId).AnonymousUser.GetAppToken("", "", userAgent)

	// if err != nil || t == nil || t.Token == "" {
	// 	res.Errors(err)
	// 	res.Code = 10018
	// 	res.Call(c)
	// 	return
	// }
	// // 6、合并用户数据

	// responseData := protos.CreateAppToken_Response{
	// 	Token:      t.Token,
	// 	CreateTime: t.CreateTime,
	// }

	// res.Data = protos.Encode(&responseData)
	res.Call(c)
}
