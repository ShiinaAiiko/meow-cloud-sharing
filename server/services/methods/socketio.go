package methods

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"sort"
	"strings"

	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/typings"
	"github.com/jinzhu/copier"

	"github.com/cherrai/nyanyago-utils/cipher"
	"github.com/cherrai/nyanyago-utils/nsocketio"
	sso "github.com/cherrai/saki-sso-go"
)

type SocketConn struct {
	Conn      *nsocketio.ConnContext
	EventName string
	Data      map[string]interface{}
	Query     *typings.SocketEncryptionQuery
}

func (s *SocketConn) Emit(data response.ResponseType) {
	var res response.ResponseType = response.ResponseType{
		Code:      data.Code,
		Data:      data.Data,
		RequestId: s.Data["requestId"].(string),
	}

	s.Conn.Emit(s.EventName, res.GetResponse())
}

func GetCallUserRoomId(userIds []int64) string {
	// fmt.Println(userIds)
	sort.SliceStable(userIds, func(i, j int) bool {
		return userIds[i] < userIds[j]
	})
	userIdsStr := FormatInt64ArrToString(userIds, "")
	// fmt.Println("userIdsStr2", userIdsStr)
	h := md5.New()
	// io.WriteString(h, "The fog is getting thicker!")
	io.WriteString(h, "user")
	io.WriteString(h, userIdsStr)
	roomId := strings.ToUpper(hex.EncodeToString(h.Sum(nil)))

	return roomId
}

// func GetUserRoomId(uid int64, deviceId string) string {
// 	return cipher.MD5(nstrings.ToString(uid) + "_" + deviceId)
// }

// 多设备兼容
// func GetUserRoomIds(uid int64) map[string]string {
// 	rKey := conf.Redisdb.GetKey("SocketIORoomId")
// 	userRoomIds := map[string]string{}
// 	err := conf.Redisdb.GetStruct(rKey.GetKey(nstrings.ToString(uid)), &userRoomIds, rKey.GetExpiration())
// 	if err != nil {
// 		return userRoomIds
// 	}
// 	return userRoomIds
// }
// func SetUserRoomId(uid int64, deviceId string) map[string]string {
// 	rKey := conf.Redisdb.GetKey("SocketIORoomId")
// 	userRoomIds := map[string]string{}
// 	err := conf.Redisdb.GetStruct(rKey.GetKey(nstrings.ToString(uid)), &userRoomIds, rKey.GetExpiration())
// 	if err != nil {
// 		return userRoomIds
// 	}
// 	return userRoomIds
// }

// func GetUserRoomIdWithDeviceId(uid int64, deviceId string) string {
// 	rKey := conf.Redisdb.GetKey("SocketIORoomId")
// 	userRoomIds := map[string]string{}
// 	err := conf.Redisdb.GetStruct(rKey.GetKey(nstrings.ToString(uid)), &userRoomIds, rKey.GetExpiration())
// 	if err != nil {
// 		return ""
// 	}
// 	return userRoomIds

// }

func MessageToSocket(namespace string, eventName string, msg interface{}) {
	fmt.Println(namespace, eventName)
	// isPush := conf.SocketIoServer.Server.BroadcastToRoom(namespace, roomId, eventName, msg)
	// fmt.Println("isPush", isPush)
}

func (s *SocketConn) DecryptionQuery(data *protos.RequestType) error {
	getUserAesKey := conf.EncryptionClient.GetUserAesKeyByKey(conf.Redisdb, s.Query.Key)
	if getUserAesKey == nil {
		return errors.New("failed to get user aes key")
	}
	// log.Info("getUserAesKey", getUserAesKey)
	aes := cipher.AES{
		Key:  getUserAesKey.AESKey,
		Mode: "CFB",
	}
	deStr, deStrErr := aes.DecryptWithString(s.Query.Data, "")
	if deStrErr != nil {
		fmt.Println("deStrErr", deStrErr)
		return errors.New("Decryption failed: " + deStrErr.Error())
	}
	dataProto := new(typings.SocketEncryptionProtoData)
	err := json.Unmarshal(deStr.Byte(), dataProto)
	if err != nil {
		return err
	}

	if err = protos.DecodeBase64(dataProto.Data, data); err != nil {
		return err
	}
	return nil
}
func (s *SocketConn) BroadcastToRoomByDeviceId(
	namespace string,
	deviceId string,
	roomId string,
	eventName string,
	res *response.ResponseProtobufType,
	sendToMyself bool) {

	cc := conf.SocketIO.GetConnContextByTag(namespace, "DeviceId", deviceId)
	if len(cc) == 0 {
		return
	}
	s.Conn = cc[0]
	s.BroadcastToRoom(roomId, eventName, res, sendToMyself)
}

func (s *SocketConn) BroadcastToRoom(
	roomId string,
	eventName string,
	res *response.ResponseProtobufType,
	sendToMyself bool) {
	cd := s.Conn.GetTag("DeviceId")
	ccList := s.Conn.GetAllConnContextInRoomWithNamespace(roomId)
	// log.Info("ccList", ccList, roomId)
	for _, v := range ccList {
		vd := v.GetTag("DeviceId")
		if !sendToMyself && cd == vd {
			// log.Info("乃是自己也")
			continue
		}

		if userAesKey := conf.EncryptionClient.GetUserAesKeyByDeviceId(conf.Redisdb, vd); userAesKey != nil {
			// log.Info("userAesKey SendJoinAnonymousRoomMessage", userAesKey)

			responseData := res.Encryption(userAesKey.AESKey, res.GetResponse())
			v.Emit(eventName, responseData)

		}
	}
}
func (s *SocketConn) BroadcastToUser(
	namespace string,
	uid string,
	eventName string,
	res *response.ResponseProtobufType) {
	cc := conf.SocketIO.GetConnContextByTag(namespace, "Uid", uid)
	if len(cc) == 0 {
		return
	}
	log.Error("BroadcastToUser", len(cc))
	for _, v := range cc {
		cd := v.GetTag("DeviceId")
		log.Info("BroadcastToUser", v.ID(), uid, v.GetTag("Uid"), cd, eventName)
		if userAesKey := conf.EncryptionClient.GetUserAesKeyByDeviceId(conf.Redisdb, cd); userAesKey != nil {
			log.Info(userAesKey.AESKey)
			responseData := res.Encryption(userAesKey.AESKey, res.GetResponse())
			v.Emit(eventName, responseData)
		}
	}
}

func (s *SocketConn) GetOnlineDeviceList(getConnContext []*nsocketio.ConnContext) ([]*protos.OnlineDeviceList, map[string]*protos.OnlineDeviceList) {
	// log.Info("当前ID", c.ID())
	// log.Info("有哪些设备在线", getConnContext)

	onlineDeviceListMap := map[string]*protos.OnlineDeviceList{}
	onlineDeviceList := []*protos.OnlineDeviceList{}
	// 2、遍历设备实例、告诉对方下线了
	for _, cctx := range getConnContext {
		// log.Info(c)
		// uid := cctx.GetTag("Uid")
		// log.Info(uid)
		deviceId := cctx.GetTag("DeviceId")
		// log.Info(deviceId)

		// userInfo
		cctxUserInfoInteface := cctx.GetSessionCache("userInfo")
		if cctxUserInfoInteface == nil {
			continue
		}
		cctxSsoUser := new(protos.SSOUserInfo)
		cctxUserInfo := cctxUserInfoInteface.(*sso.UserInfo)
		copier.Copy(cctxSsoUser, cctxUserInfo)

		// userAgent
		cctxProtoUserAgent := new(protos.UserAgent)
		cctxUserAgentInteface := cctx.GetSessionCache("userAgent")
		if cctxUserAgentInteface == nil {
			continue
		}
		cctxUserAgent := cctxUserAgentInteface.(*sso.UserAgent)
		copier.Copy(cctxProtoUserAgent, cctxUserAgent)

		// loginTime
		cctxLoginTimeInterface := cctx.GetSessionCache("loginTime")
		if cctxLoginTimeInterface == nil {
			continue
		}
		onlineDeviceListMap[deviceId] = &protos.OnlineDeviceList{
			UserInfo:  cctxSsoUser,
			LoginTime: cctxLoginTimeInterface.(int64),
			UserAgent: cctxProtoUserAgent,
			Location:  "",
			DeviceId:  deviceId,
		}
		onlineDeviceList = append(onlineDeviceList, onlineDeviceListMap[deviceId])
	}

	return onlineDeviceList, onlineDeviceListMap
}

func (s *SocketConn) LeaveRoom(namespace, uid, roomId string) {
	cc := conf.SocketIO.GetConnContextByTag(namespace, "Uid", uid)
	if len(cc) == 0 {
		return
	}

	for _, v := range cc {
		v.LeaveRoom(namespace, roomId)
	}

}
