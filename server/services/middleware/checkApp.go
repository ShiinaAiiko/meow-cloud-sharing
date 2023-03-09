package middleware

import (
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/methods"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"

	"github.com/gin-gonic/gin"
)

func CheckApp() gin.HandlerFunc {
	return func(c *gin.Context) {

		res := response.ResponseProtobufType{}
		res.Code = 10004

		roles := new(RoleOptionsType)
		getRoles, isRoles := c.Get("roles")
		if isRoles {
			roles = getRoles.(*RoleOptionsType)
		}

		if isRoles && roles.CheckAppId {
			// 解析用户数据
			var appId string

			if roles.RequestEncryption {
				if roles.ResponseDataType == "protobuf" {
					appId = c.GetString("appId")
				}
			} else {
				switch c.Request.Method {
				case "GET":
					appId = c.Query("appId")

				case "POST":
					appId = c.PostForm("appId")
				default:
					break
				}
			}
			if appId == "" || !methods.CheckAppId(appId) {
				res.Code = 10017
				res.Call(c)
				// Log.Info(res)
				c.Abort()
				return
			}
		}
		c.Next()
	}
}
