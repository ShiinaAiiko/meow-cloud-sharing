package routers

import (
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/api"
	routerV1 "github.com/ShiinaAiiko/meow-cloud-sharing/server/routers/v1"

	"github.com/gin-gonic/gin"
)

func InitRouter(r *gin.Engine) {
	api := api.ApiUrls[api.ApiVersion]
	rv1 := routerV1.Routerv1{
		Engine:  r,
		BaseUrl: api["versionPrefix"],
	}
	rv1.Init()
}
