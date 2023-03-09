package routerV1

import (
	controllersV1 "github.com/ShiinaAiiko/meow-cloud-sharing/server/controllers/v1"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/middleware"
)

func (r Routerv1) InitCall() {

	c := new(controllersV1.CallController)

	role := middleware.RoleMiddlewareOptions{
		BaseUrl: r.BaseUrl,
	}

	// protoOption := middleware.RoleOptionsType{
	// 	Authorize:          true,
	// 	RequestEncryption:  true,
	// 	ResponseEncryption: true,
	// 	CheckAppId:         true,
	// 	ResponseDataType:   "protobuf",
	// }

	r.Group.POST(
		role.SetRole(apiUrl["verifyCallToken"], &middleware.RoleOptionsType{
			Authorize:          false,
			RequestEncryption:  false,
			ResponseEncryption: false,
			CheckAppId:         false,
			ResponseDataType:   "json",
		}),
		c.VerifyCallToken)

}
