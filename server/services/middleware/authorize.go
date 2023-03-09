package middleware

import (
	"encoding/json"

	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"

	sso "github.com/cherrai/saki-sso-go"

	"github.com/gin-gonic/gin"
)

func Authorize() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Log.Info("------Authorize------")
		if _, isWsServer := c.Get("WsServer"); isWsServer {
			c.Next()
			return
		}
		res := response.ResponseProtobufType{}
		res.Code = 10004

		roles := new(RoleOptionsType)
		getRoles, isRoles := c.Get("roles")
		if isRoles {
			roles = getRoles.(*RoleOptionsType)
		}

		if isRoles && roles.Authorize {
			// 解析用户数据
			var token string
			var deviceId string
			var userAgent *sso.UserAgent

			if roles.RequestEncryption {
				if roles.ResponseDataType == "protobuf" {
					token = c.GetString("token")
					deviceId = c.GetString("deviceId")

					ua, exists := c.Get("userAgent")
					if !exists {
						res.Call(c)
						c.Abort()
						return
					}
					userAgent = ua.(*sso.UserAgent)
				} else {
					switch c.Request.Method {
					case "GET":
						token = c.Query("token")
						deviceId = c.Query("deviceId")

					case "POST":
						token = c.PostForm("token")
						deviceId = c.PostForm("deviceId")
					default:
						break
					}
				}
			} else {
				if roles.ResponseDataType == "protobuf" {
					token = c.GetString("token")
					deviceId = c.GetString("deviceId")
					if ua, exists := c.Get("userAgent"); exists {
						userAgent = ua.(*sso.UserAgent)
					}
				} else {
					switch c.Request.Method {
					case "GET":
						token = c.Query("token")
						deviceId = c.Query("deviceId")

					case "POST":
						token = c.PostForm("token")
						deviceId = c.PostForm("deviceId")
					default:
						break
					}
				}
			}
			// log.Info(token, deviceId)

			// 暂时全部开放
			if roles.isHttpServer {
				if token == "" {
					res.Call(c)
					c.Abort()
					return
				}
				// log.Info("token, deviceId, userAgent", token != "", deviceId, userAgent)
				v, err := conf.SSO.Verify(token, deviceId, userAgent)
				// log.Info("ret", v, err)
				if err != nil {
					// Log.Info("jwt: ", err)
					res.Errors(err)
					res.Code = 10004
					res.Call(c)
					c.Abort()
					return
				}
				// log.Info(v.UserInfo)
				if v != nil && v.UserInfo.Uid != "" {

					// if isExchangeKey := strings.Contains(c.Request.URL.Path, "encryption/exchangeKey"); !isExchangeKey {
					// 	// 要求登录的同时还没有key就说不过去了
					// 	userAesKeyInterface, err := c.Get("userAesKey")
					// 	if userAesKeyInterface != nil || !err {
					// 		userAesKey := userAesKeyInterface.(*encryption.UserAESKey)
					// 		if userAesKey.Uid != v.UserInfo.Uid || userAesKey.DeviceId != v.LoginInfo.DeviceId {
					// 			res.Code = 10008
					// 			res.Call(c)
					// 			c.Abort()
					// 			return
					// 		}
					// 	}
					// }
					c.Set("userInfo", v.UserInfo)
					c.Next()
					return
				}
				res.Code = 10004
				res.Call(c)
				// Log.Info(res)
				c.Abort()
				// res.Call(c)
				// c.Abort()
			} else {
				c.Next()
			}
		} else {
			c.Next()
		}
	}
}

func ConvertResponseJson(jsonStr []byte) (sso.UserInfo, error) {
	var m sso.UserInfo
	err := json.Unmarshal([]byte(jsonStr), &m)
	if err != nil {
		log.Info("Unmarshal with error: %+v\n", err)
		return m, err
	}
	return m, nil
}
