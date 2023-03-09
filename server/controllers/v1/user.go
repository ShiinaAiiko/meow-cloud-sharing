package controllersV1

import (
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/methods"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"

	"github.com/cherrai/nyanyago-utils/validation"
	"github.com/gin-gonic/gin"
)

type UserController struct {
}

func (fc *UserController) CreateAccount(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------CreateAccount------")

	// 2、获取参数
	data := new(protos.CreateAccount_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	log.Info(data)

	// 3、校验参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.AppId, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.AppKey, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Uid, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Nickname, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	if !methods.CheckApp(data.AppId, data.AppKey) {
		res.Errors(err)
		res.Code = 10017
		res.Call(c)
		return
	}

	// 4、创建Token
	// ua, exists := c.Get("userAgent")
	// if !exists {
	// 	res.Error = "UserAgent does not exist."
	// 	res.Code = 10002
	// 	res.Call(c)
	// }
	// user, err := conf.SSO.AnonymousUserRegister(data.Uid,data.Password,data.Nickname,data.Avatar,data.)
	// token, err := methods.CreateToken(&protos.MWCToken{
	// 	AppId:  data.AppId,
	// 	AppKey: data.AppKey,
	// 	// UserInfo:  *protos.MWCUserInfo,
	// 	UserAgent: ua.(*protos.UserAgent),
	// })
	// if err != nil {
	// 	res.Errors(err)
	// 	res.Code = 10004
	// 	res.Call(c)
	// 	return
	// }
	// log.Info(token)
	// update, err := conf.SSO.UpdateAnonymousUser(data.UserToken, data.Avatar, data.Nickname, data.Username, data.Bio)
	// if update == nil || err != nil {
	// 	if err != nil {
	// 		res.Error = err.Error()
	// 	}
	// 	res.Code = 10011
	// 	res.Call(c)
	// 	return
	// }

	// ssoUser := new(protos.SSOUserInfo)
	// copier.Copy(ssoUser, update.User)
	// responseData := protos.UpdateAnonymousUserProfile_Response{
	// 	DeviceId: update.DeviceId,
	// 	Token:    update.Token,
	// 	UserInfo: ssoUser,
	// }
	// res.Data = protos.Encode(&responseData)
	res.Call(c)
}

func (fc *UserController) SearchContact(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------CreateAccount------")

	// 2、获取参数
	data := new(protos.CreateAccount_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	log.Info(data)

	// 3、校验参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.AppId, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.AppKey, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Uid, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Nickname, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	if !methods.CheckApp(data.AppId, data.AppKey) {
		res.Errors(err)
		res.Code = 10017
		res.Call(c)
		return
	}

	// 4、创建Token
	// ua, exists := c.Get("userAgent")
	// if !exists {
	// 	res.Error = "UserAgent does not exist."
	// 	res.Code = 10002
	// 	res.Call(c)
	// }
	// user, err := conf.SSO.AnonymousUserRegister(data.Uid,data.Password,data.Nickname,data.Avatar,data.)
	// token, err := methods.CreateToken(&protos.MWCToken{
	// 	AppId:  data.AppId,
	// 	AppKey: data.AppKey,
	// 	// UserInfo:  *protos.MWCUserInfo,
	// 	UserAgent: ua.(*protos.UserAgent),
	// })
	// if err != nil {
	// 	res.Errors(err)
	// 	res.Code = 10004
	// 	res.Call(c)
	// 	return
	// }
	// log.Info(token)
	// update, err := conf.SSO.UpdateAnonymousUser(data.UserToken, data.Avatar, data.Nickname, data.Username, data.Bio)
	// if update == nil || err != nil {
	// 	if err != nil {
	// 		res.Error = err.Error()
	// 	}
	// 	res.Code = 10011
	// 	res.Call(c)
	// 	return
	// }

	// ssoUser := new(protos.SSOUserInfo)
	// copier.Copy(ssoUser, update.User)
	// responseData := protos.UpdateAnonymousUserProfile_Response{
	// 	DeviceId: update.DeviceId,
	// 	Token:    update.Token,
	// 	UserInfo: ssoUser,
	// }
	// res.Data = protos.Encode(&responseData)
	res.Call(c)
}

func (fc *UserController) AddContact(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------CreateAccount------")

	// 2、获取参数
	data := new(protos.CreateAccount_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	log.Info(data)

	// 3、校验参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.AppId, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.AppKey, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Uid, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Nickname, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	if !methods.CheckApp(data.AppId, data.AppKey) {
		res.Errors(err)
		res.Code = 10017
		res.Call(c)
		return
	}

	// 4、创建Token
	// ua, exists := c.Get("userAgent")
	// if !exists {
	// 	res.Error = "UserAgent does not exist."
	// 	res.Code = 10002
	// 	res.Call(c)
	// }
	// user, err := conf.SSO.AnonymousUserRegister(data.Uid,data.Password,data.Nickname,data.Avatar,data.)
	// token, err := methods.CreateToken(&protos.MWCToken{
	// 	AppId:  data.AppId,
	// 	AppKey: data.AppKey,
	// 	// UserInfo:  *protos.MWCUserInfo,
	// 	UserAgent: ua.(*protos.UserAgent),
	// })
	// if err != nil {
	// 	res.Errors(err)
	// 	res.Code = 10004
	// 	res.Call(c)
	// 	return
	// }
	// log.Info(token)
	// update, err := conf.SSO.UpdateAnonymousUser(data.UserToken, data.Avatar, data.Nickname, data.Username, data.Bio)
	// if update == nil || err != nil {
	// 	if err != nil {
	// 		res.Error = err.Error()
	// 	}
	// 	res.Code = 10011
	// 	res.Call(c)
	// 	return
	// }

	// ssoUser := new(protos.SSOUserInfo)
	// copier.Copy(ssoUser, update.User)
	// responseData := protos.UpdateAnonymousUserProfile_Response{
	// 	DeviceId: update.DeviceId,
	// 	Token:    update.Token,
	// 	UserInfo: ssoUser,
	// }
	// res.Data = protos.Encode(&responseData)
	res.Call(c)
}
