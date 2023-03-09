package socketiomidc

// import socketio "github.com/googollee/go-socket.io"

// type EventInstance struct {
// 	serverContext *SocketIoServer
// 	connContext   *ConnContext
// 	// conn          *socketio.Conn
// 	namespace string
// 	eventName string
// 	// 请求参数
// 	params map[string]interface{}
// 	// 自定义参数
// 	data map[string]interface{}
// 	// 中间件当前层数数
// 	index         int
// 	runMiddleware bool
// 	err           error
// 	f             HandlerFunc
// }

// func (c *EventInstance) Next() {
// 	if !c.runMiddleware {
// 		c.err = c.f(c)
// 		return
// 	}
// 	c.index++
// 	if c.index < len(c.serverContext.middlewareHandlers) {
// 		c.err = c.serverContext.middlewareHandlers[c.index](c)
// 	} else {
// 		c.err = c.f(c)
// 	}
// }

// func (e *EventInstance) Namespace() string {
// 	return e.namespace
// }
// func (e *EventInstance) EventName() string {
// 	return e.eventName
// }
// func (e *EventInstance) ConnContext() *ConnContext {
// 	return e.connContext
// }
// func (e *EventInstance) ServerContext() *SocketIoServer {
// 	return e.serverContext
// }
// func (e *EventInstance) Conn() socketio.Conn {
// 	return e.connContext.Conn
// }
