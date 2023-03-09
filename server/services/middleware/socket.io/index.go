package socketioMiddleware

import (
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/api"
	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
)

var (
	log              = conf.Log
	namespace        = api.Namespace[api.ApiVersion]
	routeEventName   = api.EventName[api.ApiVersion]["routeEventName"]
	requestEventName = api.EventName[api.ApiVersion]["requestEventName"]
)
