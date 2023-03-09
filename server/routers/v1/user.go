package routerV1

import (
	controllersV1 "github.com/ShiinaAiiko/meow-cloud-sharing/server/controllers/v1"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/middleware"
)

func (r Routerv1) InitUser() {
	user := new(controllersV1.UserController)

	role := middleware.RoleMiddlewareOptions{
		BaseUrl: r.BaseUrl,
	}

	// protoOption := middleware.RoleOptionsType{
	// 	Authorize:          true,
	// 	RequestEncryption:  true,
	// 	ResponseEncryption: true,
	// 	ResponseDataType:   "protobuf",
	// }

	r.Group.POST(
		role.SetRole("/user/createAccount", &middleware.RoleOptionsType{
			Authorize:          false,
			RequestEncryption:  true,
			ResponseEncryption: true,
			CheckAppId:         true,
			ResponseDataType:   "protobuf",
		}),
		user.CreateAccount)
}
