package middleware

import (
	"net/http"
	"strings"

	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"

	"github.com/gin-gonic/gin"
)

func CheckRouteMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.URL.Path == "/" ||
			strings.Contains(c.Request.URL.Path, "/favicon.ico") ||
			strings.Contains(c.Request.URL.Path, "/static/") {
			// logo
			c.Next()
			return
		}
		isWSServer := strings.Contains(c.Request.URL.Path, "/socket.io")
		if isWSServer {
			c.Set("WsServer", true)
			c.Next()
			return
		}
		isHttpServer := strings.Contains(c.Request.URL.Path, "/api")
		if isHttpServer {
			c.Set("isHttpServer", true)
			c.Next()
			return
		}

		res := response.ResponseType{}
		res.Code = 10013
		c.JSON(http.StatusOK, res.GetResponse())
		c.Abort()
	}
}
