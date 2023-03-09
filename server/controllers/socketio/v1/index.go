package socketIoControllersV1

import (

	// "github.com/cherrai/saki-sso-go"

	"errors"

	"github.com/ShiinaAiiko/meow-cloud-sharing/server/api"
	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	dbxV1 "github.com/ShiinaAiiko/meow-cloud-sharing/server/dbx/v1"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/methods"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/typings"
	"github.com/cherrai/nyanyago-utils/nsocketio"
	sso "github.com/cherrai/saki-sso-go"
	"github.com/jinzhu/copier"
	"github.com/pasztorpisti/qs"
)

var (
	messagesDbx      = dbxV1.MessagesDbx{}
	contactDbx       = dbxV1.ContactDbx{}
	groupDbx         = dbxV1.GroupDbx{}
	log              = conf.Log
	namespace        = api.Namespace[api.ApiVersion]
	routeEventName   = api.EventName[api.ApiVersion]["routeEventName"]
	requestEventName = api.EventName[api.ApiVersion]["requestEventName"]
)

type BaseController struct {
}

func (bc *BaseController) Connect(e *nsocketio.EventInstance) error {
	log.Info("/ => 正在进行连接.")
	// Conn := e.Conn()

	c := e.ConnContext()

	var res response.ResponseProtobufType

	// fmt.Println(msgRes)
	defer func() {
		// fmt.Println("Error middleware.2222222222222")
		if err := recover(); err != nil {
			log.Info(err)
			res.Code = 10001
			res.Data = err.(error).Error()
			c.Emit(routeEventName["error"], res.GetResponse())
			go c.Close()
		}
	}()
	msc := methods.SocketConn{
		Conn: c,
	}
	// s.SetContext("dsdsdsd")
	// 申请一个房间

	query := new(typings.SocketEncryptionQuery)

	err := qs.Unmarshal(query, c.Conn.URL().RawQuery)

	if err != nil {
		res.Code = 10002
		res.Data = err.Error()
		c.Emit(routeEventName["error"], res.GetResponse())
		go c.Close()
		return err
	}
	msc.Query = query

	// log.Info("query", query)

	queryData := new(protos.RequestType)
	// queryData.DeviceId

	// log.Info("deQueryDataErr", deQueryDataErr != nil, deQueryDataErr)
	if err = msc.DecryptionQuery(queryData); err != nil {
		// log.Info("Decryption", err)
		res.Code = 10009
		res.Data = err.Error()
		c.Emit(routeEventName["error"], res.GetResponse())
		go c.Close()

		return err
	}
	// log.Info("queryData", q ueryData)

	// ntimer.SetTimeout(func() {
	// 	defer c.Close()
	// }, 3000)

	if !methods.CheckAppId(queryData.AppId) {
		res.Code = 10017
		c.Emit(routeEventName["error"], res.GetResponse())
		go c.Close()
		return errors.New(res.Msg)
	}

	ua := new(sso.UserAgent)
	copier.Copy(ua, queryData.UserAgent)

	getUser, err := conf.SSO.Verify(queryData.Token, queryData.DeviceId, ua)
	// log.Info("getUser", getUser, err)
	if err != nil || getUser == nil || getUser.UserInfo.Uid == "" {
		res.Code = 10004
		res.Data = "SSO Error: " + err.Error()
		c.Emit(routeEventName["error"], res.GetResponse())
		go c.Close()
		return err
	} else {

		// 检测之前是否登录过了，登录过把之前的实例干掉
		ccList := conf.SocketIO.GetConnContextByTag(namespace["base"], "DeviceId", queryData.DeviceId)
		// log.Info("检测之前是否登录过了，登录过把之前的实例干掉", len(ccList))
		for _, v := range ccList {
			// log.Info("1、发送信息告知对方下线")
			userAesKey := conf.EncryptionClient.GetUserAesKeyByDeviceId(conf.Redisdb, queryData.DeviceId)
			// log.Info("userAesKey", userAesKey)
			if userAesKey != nil {
				var res response.ResponseProtobufType
				res.Code = 200
				res.Data = protos.Encode(&protos.OnForceOffline_Response{})
				eventName := routeEventName["forceOffline"]
				responseData := res.Encryption(userAesKey.AESKey, res.GetResponse())

				if isEmit := v.Emit(eventName, responseData); isEmit {
					// 2、断开连接
					// log.Info("有另外一个设备在线", userAesKey)
					go v.Close()
				}
			}

		}
		log.Info("/ UID " + getUser.UserInfo.Uid + ", Connection to Successful.")

		c.SetSessionCache("loginTime", getUser.LoginInfo.LoginTime)
		c.SetSessionCache("appId", queryData.AppId)
		c.SetSessionCache("userInfo", getUser.UserInfo)
		c.SetSessionCache("deviceId", queryData.DeviceId)
		c.SetSessionCache("userAgent", ua)
		c.SetTag("Uid", getUser.UserInfo.Uid)
		c.SetTag("DeviceId", queryData.DeviceId)

		// log.Info("SocketIO Client连接成功：", Conn.ID())

		// sc.SetUserInfo(&ret.Payload)

		// log.Info("------ 1、检测其他设备是否登录------")
		// 1、检测其他设备是否登录
		sc := e.ServerContext()
		getConnContext := sc.GetConnContextByTag(namespace["base"], "Uid", getUser.UserInfo.Uid)
		// log.Info("当前ID", c.ID())
		// log.Info("检测其他设备是否登录, 有哪些设备在线", len(getConnContext))

		onlineDeviceList, onlineDeviceListMap := msc.GetOnlineDeviceList(getConnContext)

		// log.Info("onlineDeviceList2", onlineDeviceListMap)

		currentDevice := onlineDeviceListMap[queryData.DeviceId]
		for _, cctx := range getConnContext {
			deviceId := cctx.GetTag("DeviceId")
			// log.Info(deviceId)

			if deviceId == queryData.DeviceId {
				// log.Info("乃是自己也")
				continue
			}
			// userAesKey1 := conf.EncryptionClient.GetUserAesKeyByDeviceId(conf.Redisdb, deviceId)

			if userAesKey := conf.EncryptionClient.GetUserAesKeyByDeviceId(conf.Redisdb, deviceId); userAesKey != nil {
				// log.Info("userAesKey SendJoinAnonymousRoomMessage", userAesKey)

				var res response.ResponseProtobufType
				res.Code = 200

				res.Data = protos.Encode(&protos.OtherDeviceOnline_Response{
					CurrentDevice:    currentDevice,
					OnlineDeviceList: onlineDeviceList,
				})

				eventName := routeEventName["otherDeviceOnline"]
				responseData := res.Encryption(userAesKey.AESKey, res.GetResponse())
				log.Info(cctx.Namespace(), eventName, responseData)
				cctx.Emit(eventName, responseData)
				// if isEmit := cctx.Emit(eventName, responseData); isEmit {
				// 	// 发送成功或存储到数据库
				// } else {
				// 	// 存储到数据库作为离线数据
				// }
			}

		}
	}

	return nil
}

func (bc *BaseController) Disconnect(e *nsocketio.EventInstance) error {
	log.Info("/ => 已经断开了")

	c := e.ConnContext()
	msc := methods.SocketConn{
		Conn: c,
	}

	// 1、检测其他设备是否登录
	sc := e.ServerContext()

	getConnContext := sc.GetConnContextByTag(namespace["base"], "Uid", c.GetTag("Uid"))
	// log.Info("当前ID", c.ID())
	// log.Info("有哪些设备在线", getConnContext)

	// 2、遍历设备实例、告诉对方下线了
	onlineDeviceList, onlineDeviceListMap := msc.GetOnlineDeviceList(getConnContext)

	deviceId := c.GetSessionCache("deviceId")
	if deviceId == nil {
		return nil
	}
	currentDevice := onlineDeviceListMap[deviceId.(string)]

	for _, cctx := range getConnContext {
		deviceId := cctx.GetTag("DeviceId")
		// log.Info(deviceId)

		if deviceId == c.GetSessionCache("deviceId") {
			// log.Info("乃是自己也")
			continue
		}
		// userAesKey1 := conf.EncryptionClient.GetUserAesKeyByDeviceId(conf.Redisdb, deviceId)

		if userAesKey := conf.EncryptionClient.GetUserAesKeyByDeviceId(conf.Redisdb, deviceId); userAesKey != nil {
			// log.Info("userAesKey SendJoinAnonymousRoomMessage", userAesKey)

			var res response.ResponseProtobufType
			res.Code = 200

			res.Data = protos.Encode(&protos.OtherDeviceOffline_Response{
				CurrentDevice:    currentDevice,
				OnlineDeviceList: onlineDeviceList,
			})

			eventName := routeEventName["otherDeviceOffline"]
			responseData := res.Encryption(userAesKey.AESKey, res.GetResponse())
			cctx.Emit(eventName, responseData)
			// if isEmit := cctx.Emit(eventName, responseData); isEmit {
			// 	// 发送成功或存储到数据库
			// } else {
			// 	// 存储到数据库作为离线数据
			// }
		}

	}

	return nil
}
