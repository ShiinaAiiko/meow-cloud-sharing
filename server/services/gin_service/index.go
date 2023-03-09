package gin_service

import (
	"net/http"
	"strconv"

	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/routers"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/middleware"

	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/gin-gonic/gin"
)

var log = nlog.New()

var Router *gin.Engine

func Init() {
	// gin.SetMode(conf.Config.Server.Mode)
	// Router = gin.New()
	gin.SetMode(conf.Config.Server.Mode)

	Router = gin.New()

	InitRouter()
	run()
}

func InitRouter() {
	// 处理跨域
	Router.Use(middleware.Cors([]string{"*"}))
	Router.NoMethod(func(ctx *gin.Context) {
		ctx.String(200, "Meow Whisper!\nNot method.")
	})
	Router.Use(middleware.CheckRouteMiddleware())
	Router.Use(middleware.RoleMiddleware())
	Router.Use(middleware.Params())
	// 处理返回值
	Router.Use(middleware.Response())
	// 请求时间中间件
	Router.Use(middleware.RequestTime())
	// 错误中间件
	Router.Use(middleware.Error())
	// 处理解密加密
	Router.Use(middleware.Encryption())
	Router.Use(middleware.CheckApp())
	Router.Use(middleware.Authorize())
	// midArr := [...]gin.HandlerFunc{GinMiddleware("*"), middleware.Authorize()}
	// fmt.Println(midArr)
	// for _, midFunc := range midArr {
	// 	//fmt.Println(index, "\t",value)
	// 	Router.Use(midFunc)
	// }
	Router.StaticFS("/public", http.Dir("./public"))
	routers.InitRouter(Router)

}

func run() {

	if err := Router.Run(":" + strconv.Itoa(conf.Config.Server.Port)); err != nil {
		log.Error("failed run app: ", err)

		// time.AfterFunc(500*time.Millisecond, func() {
		// 	run(router)
		// })
	} else {
		log.Info("Gin Http server created successfully. Listening at :" + strconv.Itoa(conf.Config.Server.Port))
	}
}
