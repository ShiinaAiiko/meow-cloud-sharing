package socketioRouter

import (
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/api"
	socketIoControllersV1 "github.com/ShiinaAiiko/meow-cloud-sharing/server/controllers/socketio/v1"

	"github.com/cherrai/nyanyago-utils/nsocketio"
)

type V1 struct {
	Server *nsocketio.NSocketIO
	Router RouterV1
}

type RouterV1 struct {
	Chat string
	Base string
	Room string
}

var namespace = api.Namespace[api.ApiVersion]
var routeEventName = api.EventName[api.ApiVersion]["routeEventName"]
var requestEventName = api.EventName[api.ApiVersion]["requestEventName"]

func (v V1) Init() {
	v.InitChat()
	v.InitUser()
	v.InitSecretChat()
	r := v.Router

	// s.OnConnect(r.Chat, func(s socketio.Conn) error {
	// 	fmt.Println(r.Chat+"连接成功：", s.ID())
	// 	return nil
	// })

	// r := v.Router
	bc := new(socketIoControllersV1.BaseController)
	v.Server.OnConnect(r.Base, bc.Connect)
	v.Server.OnDisconnect(r.Base, bc.Disconnect)

	// v.Server.OnConnect(r.Chat, socketIoControllersV1.NewConnect)
	// v.Server.OnDisconnect(r.Chat, socketIoControllersV1.Disconnect)

}
