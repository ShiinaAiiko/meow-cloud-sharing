package socketiomidc

import (
	"sync"
	"time"

	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/cherrai/nyanyago-utils/nredis"
	socketio "github.com/googollee/go-socket.io"
)

var (
	log = nlog.New()
)

type SocketIoServer struct {
	Server             *socketio.Server
	RDB                *nredis.NRedis
	handlers           middlewareFuncType
	disconnectHandlers map[string]([](DisconnectHandlerFunc))
	connectHandlers    map[string]([](ConnectHandlerFunc))
	rooms              map[string](map[string](map[string]*ConnContext))

	sockets      socketsType
	SessionCache SocketCacheType

	connContextMap map[string](map[string](map[string]*ConnContext))
}
type SocketCacheItemType map[string]interface{}
type SocketCacheType map[string]SocketCacheItemType

type DisconnectHandlerFunc func(s *ConnContext, reason string)
type ConnectHandlerFunc func(s *ConnContext) error
type HandlerFunc func(s *ConnContext) error

type middlewareFuncType []HandlerFunc
type socketsType map[string]socketsNamespaceType

// nammespace+customId+deviceId+deviceType
type socketsNamespaceType map[string]*ConnContext

type NSocketIONewOptions struct {
	RDB *nredis.NRedis
}

func New(server *socketio.Server, options NSocketIONewOptions) *SocketIoServer {
	s := new(SocketIoServer)
	s.Server = server
	s.RDB = options.RDB
	s.RDB.CreateKeys(map[string]*nredis.RedisCacheKeysType{
		"NSocketIOCustomId": {
			Key:        "NSocketIOCustomId",
			Expiration: 5 * 60 * time.Second,
		},
		"NSocketIOTags": {
			Key:        "NSocketIOTags",
			Expiration: 5 * 60 * time.Second,
		},
	})
	s.disconnectHandlers = map[string]([](DisconnectHandlerFunc)){}
	s.connectHandlers = map[string]([](ConnectHandlerFunc)){}
	s.connContextMap = map[string](map[string](map[string]*ConnContext)){}
	s.sockets = make(socketsType)

	s.rooms = map[string](map[string](map[string]*ConnContext)){}
	s.init()

	return s
}
func (s *SocketIoServer) init() {

}

func (s *SocketIoServer) OnConnect(namespace string, f func(c *ConnContext) error) {
	if s.connectHandlers[namespace] == nil {
		s.connectHandlers[namespace] = [](ConnectHandlerFunc){}
	}
	s.connectHandlers[namespace] = append(s.connectHandlers[namespace], f)

	s.Server.OnConnect(namespace, func(sc socketio.Conn) error {
		var m sync.RWMutex
		conn := ConnContext{
			ServerContext: s,
			Conn:          sc,
			index:         -1,
			namespace:     namespace,
			data:          make(map[string]interface{}),
			mu:            m,
			runMiddleware: false,
		}
		conn.init()
		log.Info("---------------------- OnConnect", namespace, sc.ID(), "----------------------")
		// conn.init()

		for _, f := range s.connectHandlers[namespace] {
			f(&conn)
		}
		return conn.err
	})
	// s.Server.OnDisconnect(namespace, func(c *ConnContext, reason string) {
	// 	log.Info("sas")
	// })
	s.Server.OnDisconnect(namespace, func(sc socketio.Conn, reason string) {

		var m sync.RWMutex
		conn := ConnContext{
			ServerContext: s,
			Conn:          sc,
			index:         -1,
			namespace:     namespace,
			data:          make(map[string]interface{}),
			mu:            m,
			runMiddleware: false,
		}

		log.Info("GetConnContext", s.GetConnContext(namespace, sc.ID()).ID())
		log.Info("---------------------- OnDisconnect", namespace, sc.ID(), "----------------------")
		// conn.init()
		// 删除该实例的所有Room
		for _, f := range s.disconnectHandlers[namespace] {
			f(&conn, reason)
		}
		// log.Error(namespace, 11111111111111, 22222222222222, 333333333333)

		// conn.clear()
		conn.LeaveAllRoom()
		conn.ClearSessionCache()

	})
}

func (s *SocketIoServer) Router(namespace string, eventName string, f HandlerFunc) {
	s.Server.OnEvent(namespace, eventName, func(sc socketio.Conn, params interface{}) error {
		// fmt.Println("Router函数")
		initData := make(map[string]interface{})
		var m sync.RWMutex
		conn := ConnContext{
			ServerContext: s,
			Conn:          sc,
			index:         -1,
			namespace:     namespace,
			eventName:     eventName,
			params:        params.(map[string]interface{}),
			data:          initData,
			f:             f,
			mu:            m,
			runMiddleware: true,
		}
		log.Info("---------------------- OnEvent", namespace, sc.ID(), "----------------------")
		conn.Next()
		return conn.err
	})
}

func (s *SocketIoServer) OnDisconnect(namespace string, f func(c *ConnContext, reason string)) {
	if s.disconnectHandlers[namespace] == nil {
		s.disconnectHandlers[namespace] = [](DisconnectHandlerFunc){}
	}
	s.disconnectHandlers[namespace] = append(s.disconnectHandlers[namespace], f)

}

func (s *SocketIoServer) Use(f HandlerFunc) {
	s.handlers = append(s.handlers, f)
}
