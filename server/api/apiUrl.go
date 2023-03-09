package api

var ApiVersion = "v1"

var ApiUrls = map[string](map[string]string){
	"v1": {
		"versionPrefix": "/api/v1",
		// SSO
		"createAppToken": "/sso/createAppToken",
		"verifyAppToken": "/sso/verifyAppToken",

		// Encryption
		"encryptionExchangeKey": "/encryption/exchangeKey",

		// Contact
		"searchContact":      "/contact/search",
		"searchUserInfoList": "/contact/userInfo/list/search",
		"addContact":         "/contact/add",
		"deleteContact":      "/contact/delete",
		"getContactList":     "/contact/list/get",

		// Group
		"newGroup":           "/group/new",
		"getAllJoinedGroups": "/group/list/joined/get",
		"getGroupInfo":       "/group/info/get",
		"disbandGroup":       "/group/disband",
		"updateGroupInfo":    "/group/update/info",
		// type OnlyAdd/FullAccess
		"getGroupMembers":    "/group/members/get",
		"joinGroup":          "/group/members/join",
		"leaveGroup":         "/group/members/leave",
		"updateGroupMembers": "/group/members/update",

		// Room
		"createRoom":         "/room/create",
		"getRoomInfo":        "/room/info/get",
		"deleteRoom":         "/room/delete",
		"updateRoom":         "/room/update",
		"getAllCreatedRooms": "/room/list/created/get",
		"getAllJoiendRooms":  "/room/list/joined/get",
		"applyJoinRoom":      "/room/join/apply",
		// type all/apply/agree/disagree
		"getJoinRoomLogList": "/room/log/list/get",
		"agreeJoinRoom":      "/room/join/agree",
		"disagreeJoinRoom":   "/room/join/disagree",
		// 房间ID全部获取
		"getRoomMembers": "/room/members/list/get",
		"leaveRoom":      "/room/leave",

		// Message
		"getRecentChatDialogueList": "/message/chatDialogue/recent/list/get",
		// 譬如bot用（预留）
		"sendMessage": "/message/send",
		// 可以根据时间范围筛选
		"getHistoricalMessages": "/message/historical/list/get",
		"readAllMessages":       "/message/read/all",
		"deleteMessages":        "/message/delete",

		// User
		// 传入ID数组，返用户数组
		"getUserInfoList": "/user/info/list/get",

		// File
		"getUploadFileToken":               "/file/uplpad/token/get",
		"getCustomStickersUploadFileToken": "/file/customStickers/uplpad/token/get",
		"getCustomStickersFileUrl":         "/file/customStickers/url/get",

		// call
		"verifyCallToken": "/call/token/verify",
	},
}
