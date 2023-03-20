package controllersV1

import (
	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"
	"github.com/cherrai/nyanyago-utils/nint"
	"github.com/cherrai/nyanyago-utils/validation"
	"github.com/gin-gonic/gin"
	"github.com/jinzhu/copier"
)

type UserController struct {
}

func (fc *UserController) GerUsers(c *gin.Context) {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、获取参数
	params := new(protos.GerUsers_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), params); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}

	log.Info("params", params.Uids)

	// 3、校验参数
	if err := validation.ValidateStruct(
		params,
		validation.Parameter(&params.Uids, validation.Required()),
	); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}
	log.Info("params", params.Uids)

	users, err := conf.SSO.GetUsers(params.Uids)
	if err != nil {
		res.Error = err.Error()
		res.Code = 10018
		res.Call(c)
		return
	}

	list := []*protos.SSOUserInfo{}
	for _, v := range users {
		ssoUser := new(protos.SSOUserInfo)
		copier.Copy(ssoUser, v)
		list = append(list, ssoUser)
	}
	protoData := &protos.GerUsers_Response{
		List:  list,
		Total: nint.ToInt64(len(list)),
	}

	res.Data = protos.Encode(protoData)

	res.Call(c)
}
