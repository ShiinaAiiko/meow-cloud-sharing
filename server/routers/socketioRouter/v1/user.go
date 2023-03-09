package socketioRouter

import socketIoControllersV1 "github.com/ShiinaAiiko/meow-cloud-sharing/server/controllers/socketio/v1"

// 一对一聊天
func (v *V1) InitUser() {
	midS := v.Server
	r := v.Router

	R := midS.Router
	R(r.Base, "SendMessagesToOtherDevices", socketIoControllersV1.SendMessagesToOtherDevices)
	// // R(r.Chat, "GetAllUsersInAnonymousRoom", socketIoControllersV1.GetAllUsersInAnonymousRoom)

	// v.Server.OnDisconnect(r.Chat, socketIoControllersV1.SecretChatDisconnect)

}
