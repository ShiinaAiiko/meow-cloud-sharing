package routerV1

import (
	controllersV1 "github.com/ShiinaAiiko/meow-cloud-sharing/server/controllers/v1"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/middleware"
)

func (r Routerv1) IniMessage() {
	c := new(controllersV1.MessageController)

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

	r.Group.GET(
		role.SetRole(apiUrl["getRecentChatDialogueList"], &protoOption),
		c.GetRecentChatDialogueList)

	r.Group.GET(
		role.SetRole(apiUrl["getHistoricalMessages"], &protoOption),
		c.GetHistoricalMessages)

	r.Group.POST(
		role.SetRole(apiUrl["readAllMessages"], &protoOption),
		c.ReadAllMessages)

	r.Group.POST(
		role.SetRole(apiUrl["deleteMessages"], &protoOption),
		c.DeleteMessages)

}
