package routerV1

import (
	controllersV1 "github.com/ShiinaAiiko/meow-cloud-sharing/server/controllers/v1"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/middleware"
)

func (r Routerv1) InitSAaSS() {
	c := new(controllersV1.SAaSSController)

	role := middleware.RoleMiddlewareOptions{
		BaseUrl: r.BaseUrl,
	}

	protoOption := middleware.RoleOptionsType{
		Authorize:          true,
		RequestEncryption:  false,
		ResponseEncryption: false,
		CheckAppId:         false,
		ResponseDataType:   "protobuf",
	}

	r.Group.POST(
		role.SetRole("/saass/appToken/get", &protoOption),
		c.GetAppToken)

}
