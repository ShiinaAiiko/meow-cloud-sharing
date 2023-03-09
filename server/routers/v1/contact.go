package routerV1

import (
	controllersV1 "github.com/ShiinaAiiko/meow-cloud-sharing/server/controllers/v1"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/middleware"
)

func (r Routerv1) InitContact() {
	c := new(controllersV1.ContactController)

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
		role.SetRole(apiUrl["searchContact"], &middleware.RoleOptionsType{
			Authorize:          false,
			RequestEncryption:  true,
			ResponseEncryption: true,
			CheckAppId:         true,
			ResponseDataType:   "protobuf",
		}),
		c.SearchContact)

	r.Group.GET(
		role.SetRole(apiUrl["searchUserInfoList"], &protoOption),
		c.SearchUserInfoList)

	r.Group.POST(
		role.SetRole(apiUrl["addContact"], &protoOption),
		c.AddContact)

	r.Group.POST(
		role.SetRole(apiUrl["deleteContact"], &protoOption),
		c.DeleteContact)

	r.Group.GET(
		role.SetRole(apiUrl["getContactList"], &protoOption),
		c.GetContactList)
}
