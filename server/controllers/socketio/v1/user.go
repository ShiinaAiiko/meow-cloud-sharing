package socketIoControllersV1

import (
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"

	"github.com/cherrai/nyanyago-utils/nsocketio"
	"github.com/cherrai/nyanyago-utils/validation"
)

// 同步数据用，暂定预留
func SendMessagesToOtherDevices(e *nsocketio.EventInstance) error {
	// c := e.ConnContext()
	// 1、初始化返回体
	var res response.ResponseProtobufType
	log.Info("------SendMessagesToOtherDevices------")

	// 2、获取参数
	data := new(protos.SendMessagesToOtherDevices_Request)

	var err error
	if err = protos.DecodeBase64(e.GetString("data"), data); err != nil {
		res.Msg = err.Error()
		res.Code = 10002
		res.CallSocketIo(e)
		return err
	}
	// 3、校验参数
	err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.DeviceId, validation.Required()),
		validation.Parameter(&data.ApiName, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Data, validation.Type("string"), validation.Required()),
	)
	if err != nil {
		res.Msg = err.Error()
		res.Code = 10002
		res.CallSocketIo(e)
		return err
	}

	// userAgent, formatUserAgent := e.GetSessionCache("userAgent").(*sso.UserAgent)
	// asUser, err := methods.ValidateSecretChatToken(data.Token, userAgent)
	// c.SetSessionCache("anonymousUserInfo", asUser)
	// if asUser == nil || err != nil || !formatUserAgent {
	// 	res.Errors(err)
	// 	res.Code = 10002
	// 	res.CallSocketIo(e)
	// 	return err
	// }

	// // // 4、校验token是否有效
	// // aUser, err := CheckAnonymousToken(c, data.AnonymousUserToken, data.AnonymousUserDeviceId, userAgent, data.InvitationCode)
	// // if aUser == nil || err != nil {
	// // 	if err != nil {
	// // 		res.Msg = err.Error()
	// // 	}
	// // 	res.Code = 10304
	// // 	res.CallSocketIo(e)
	// // 	return err
	// // }
	// roomId := methods.GetAnonymousRoomId(data.Token.InvitationCode)
	// // log.Info("「"+data.ApiName+"」,"+data.InvitationCode+" ：", data.Data)
	// // 5、发送群消息
	// conns := c.GetAllConnContextInRoomWithNamespace(roomId)
	// // log.Info("roomId", roomId, conns)

	// sendTimes := int64(0)
	// successTimes := int64(0)
	// for _, conn := range conns {
	// 	// log.Info("conn.ID() ", conn.ID(), c.ID())
	// 	if conn.ID() == "" || conn.ID() == c.ID() {
	// 		continue
	// 	}
	// 	sendTimes++
	// 	userInfo, isuserInfo := conn.GetSessionCacheWithConnId(conn.ID(), "userInfo").(*sso.UserInfo)
	// 	// log.Info(userInfo, isuserInfo)
	// 	if !isuserInfo {
	// 		continue
	// 	}
	// 	var res response.ResponseProtobufType
	// 	res.Code = 200
	// 	res.Data = protos.Encode(&protos.OnAnonymousMessage_Response{
	// 		RoomId:         roomId,
	// 		InvitationCode: data.Token.InvitationCode,
	// 		AuthorId:       asUser.Uid,
	// 		ApiName:        data.ApiName,
	// 		Data:           data.Data,
	// 	})

	// 	getConnContext := e.ServerContext().GetConnContextByTag(conf.SocketRouterNamespace["Chat"], "Uid", nstrings.ToString(userInfo.Uid))
	// 	// log.Info("getConnContext", nstrings.ToString(userInfo.Uid), getConnContext)
	// 	for _, sConn := range getConnContext {
	// 		// uid := sConn.GetTag("Uid")
	// 		// // log.Info("uid", uid)
	// 		deviceId := sConn.GetTag("DeviceId")
	// 		// log.Info("deviceId", deviceId)

	// 		if userAesKey := conf.EncryptionClient.GetUserAesKeyByDeviceId(conf.Redisdb, deviceId); userAesKey != nil {

	// 			eventName := conf.SocketRouterEventNames["OnAnonymousMessage"]
	// 			responseData := res.Encryption(userAesKey.AESKey, res.GetReponse())
	// 			// 4、目标对象返回体
	// 			// log.Info("eventName", eventName, sConn.GetTag("Uid"), sConn)
	// 			isEmit := sConn.Emit(eventName, responseData)
	// 			if isEmit {
	// 				// 发送成功或存储到数据库
	// 				successTimes++
	// 			} else {
	// 				// 存储到数据库作为离线数据
	// 			}
	// 		}
	// 	}
	// }
	// res.Code = 200
	// if successTimes == 0 || successTimes < sendTimes {
	// 	res.Code = 10016
	// }
	res.Data = protos.Encode(&protos.SendMessagesToOtherDevices_Response{
		// SendTimes:    sendTimes,
		// SuccessTimes: successTimes,
	})
	res.CallSocketIo(e)
	return nil
}
