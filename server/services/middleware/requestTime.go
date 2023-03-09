package middleware

import (
	"github.com/gin-gonic/gin"
)

func RequestTime() gin.HandlerFunc {
	return func(c *gin.Context) {
		lt := log.Time()
		c.Next()
		lt.TimeEnd(c.Request.URL.Path + ", Request Time =>")
	}
}
