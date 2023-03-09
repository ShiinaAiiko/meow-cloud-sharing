package middleware

import (
	"net/http"
	"strings"

	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"

	"github.com/gin-gonic/gin"
)

type RoleOptionsType struct {
	BaseUrl            string
	Authorize          bool
	RequestEncryption  bool
	ResponseEncryption bool
	UseUserAeskey      bool
	ResponseDataType   string
	isSocketServer     bool
	isHttpServer       bool
	CheckAppId         bool
}

type RoleMiddlewareOptions struct {
	BaseUrl string
}

// 存储各个路由的权限信息
var Roles map[string]*RoleOptionsType

func (r *RoleMiddlewareOptions) SetRole(relativePath string, opt *RoleOptionsType) string {
	if Roles != nil {
		Roles[r.BaseUrl+relativePath] = opt
	} else {
		Roles = make(map[string]*RoleOptionsType)
		Roles[r.BaseUrl+relativePath] = opt
	}
	return relativePath
}

func RoleMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if _, isWsServer := c.Get("WsServer"); isWsServer {
			c.Next()
			return
		}

		isHttpServer := strings.Contains(c.Request.URL.Path, "/api")
		if isHttpServer {
			role := Roles[c.Request.URL.Path]
			if role == nil {
				res := response.ResponseType{}
				res.Code = 10013
				c.JSON(http.StatusOK, res.GetResponse())
				c.Abort()
				return
			}
			role.isHttpServer = isHttpServer
			role.isSocketServer = !isHttpServer
			c.Set("roles", role)
			c.Next()
			return
		}
		c.Next()
	}
}
