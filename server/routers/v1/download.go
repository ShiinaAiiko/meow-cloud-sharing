package routerV1

import (
	controllersV1 "github.com/ShiinaAiiko/meow-cloud-sharing/server/controllers/v1"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/middleware"
)

func (r Routerv1) InitDownload() {
	c := new(controllersV1.DownloadController)

	role := middleware.RoleMiddlewareOptions{
		BaseUrl: r.BaseUrl,
	}

	protoOption := middleware.RoleOptionsType{
		Authorize:          false,
		RequestEncryption:  false,
		ResponseEncryption: false,
		CheckAppId:         false,
		ResponseDataType:   "protobuf",
	}

	r.Group.GET(
		role.SetRole("/download/urls/get", &protoOption),
		c.GetDownloadUrls)

}
