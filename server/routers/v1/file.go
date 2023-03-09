package routerV1

import (
	controllersV1 "github.com/ShiinaAiiko/meow-cloud-sharing/server/controllers/v1"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/middleware"
)

func (r Routerv1) InitFile() {
	c := new(controllersV1.FileController)

	role := middleware.RoleMiddlewareOptions{
		BaseUrl: r.BaseUrl,
	}

	protoOption := middleware.RoleOptionsType{
		Authorize:          true,
		RequestEncryption:  true,
		ResponseEncryption: true,
		CheckAppId:         true,
		ResponseDataType:   "protobuf",
	}

	r.Group.POST(
		role.SetRole(apiUrl["getUploadFileToken"], &protoOption),
		c.GetUploadFileToken)

	r.Group.POST(
		role.SetRole(apiUrl["getCustomStickersUploadFileToken"], &protoOption),
		c.GetCustomStickersUploadFileToken)

	r.Group.GET(
		role.SetRole(apiUrl["getCustomStickersFileUrl"], &protoOption),
		c.GetCustomStickersFileUrl)

}
