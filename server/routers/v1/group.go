package routerV1

import (
	controllersV1 "github.com/ShiinaAiiko/meow-cloud-sharing/server/controllers/v1"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/middleware"
)

func (r Routerv1) InitGroup() {
	c := new(controllersV1.GroupController)

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
		role.SetRole(apiUrl["newGroup"], &protoOption),
		c.NewGroup)

	r.Group.GET(
		role.SetRole(apiUrl["getAllJoinedGroups"], &protoOption),
		c.GetAllJoinedGroups)

	r.Group.GET(
		role.SetRole(apiUrl["getGroupInfo"], &middleware.RoleOptionsType{
			Authorize:          false,
			RequestEncryption:  true,
			ResponseEncryption: true,
			CheckAppId:         true,
			ResponseDataType:   "protobuf",
		}),
		c.GetGroupInfo)

	r.Group.GET(
		role.SetRole(apiUrl["getGroupMembers"], &middleware.RoleOptionsType{
			Authorize:          false,
			RequestEncryption:  true,
			ResponseEncryption: true,
			CheckAppId:         true,
			ResponseDataType:   "protobuf",
		}),
		c.GetGroupMembers)

	r.Group.POST(
		role.SetRole(apiUrl["leaveGroup"], &protoOption),
		c.LeaveGroup)

	r.Group.POST(
		role.SetRole(apiUrl["joinGroup"], &protoOption),
		c.JoinGroup)

	r.Group.POST(
		role.SetRole(apiUrl["disbandGroup"], &protoOption),
		c.DisbandGroup)

	r.Group.POST(
		role.SetRole(apiUrl["updateGroupInfo"], &protoOption),
		c.UpdateGroupInfo)
}
