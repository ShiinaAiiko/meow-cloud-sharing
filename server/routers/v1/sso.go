package routerV1

import (
	controllersV1 "github.com/ShiinaAiiko/meow-cloud-sharing/server/controllers/v1"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/middleware"
)

func (r Routerv1) InitSSO() {
	//  /encryption/rsapublickey
	//  /encryption/rsakey
	c := new(controllersV1.SSOController)

	role := middleware.RoleMiddlewareOptions{
		BaseUrl: r.BaseUrl,
	}
	r.Group.GET(role.SetRole(apiUrl["createAppToken"], &middleware.RoleOptionsType{
		Authorize:          false,
		RequestEncryption:  true,
		ResponseEncryption: true,
		ResponseDataType:   "protobuf",
	}), c.CreateAppToken)

	r.Group.POST(role.SetRole(apiUrl["verifyAppToken"], &middleware.RoleOptionsType{
		Authorize:          false,
		RequestEncryption:  true,
		ResponseEncryption: true,
		ResponseDataType:   "protobuf",
	}), c.VerifyAppToken)

}
