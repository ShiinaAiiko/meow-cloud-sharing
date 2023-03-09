package middleware

import (
	"net/http"

	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"

	"github.com/gin-gonic/gin"
)

func Response() gin.HandlerFunc {
	return func(c *gin.Context) {
		if _, isWsServer := c.Get("WsServer"); isWsServer {
			c.Next()
			return
		}
		roles := new(RoleOptionsType)
		getRoles, isRoles := c.Get("roles")

		if isRoles {
			roles = getRoles.(*RoleOptionsType)
		} else {
			// res := response.ResponseType{}
			// res.Code = 10013
			// c.JSON(http.StatusOK, res.GetResponse())
			// return
		}
		if isRoles && roles.isHttpServer {
			defer func() {
				roles := c.MustGet("roles").(*RoleOptionsType)
				userAesKey := c.GetString("userAesKey")
				// userAesKey := ""

				// isExchangeKey := strings.Contains(c.Request.URL.Path, "encryption/exchangeKey")

				// if !isExchangeKey {
				// 	// log.Error("isExchangeKey", isExchangeKey)
				// 	// userInfo, isExists := c.Get("userInfo")
				// 	// // log.Info("userInfo", userInfo)
				// 	// if isExists {
				// 	// 	authorId := userInfo.(*sso.UserInfo).Uid
				// 	// 	rKey := conf.Redisdb.GetKey("User-AESKey")
				// 	// 	rVal, err := conf.Redisdb.Get(rKey.GetKey(nstrings.ToString(authorId)))
				// 	// 	if err != nil {
				// 	// 		log.Error(err)
				// 	// 	}
				// 	// 	log.Info("中间件 RESPONSE 获取UserAesKey", rVal.Value.Val())
				// 	// 	userAesKey = rVal.Value.Val()
				// 	// }
				// 	// log.Info(c.Request.URL.Path)
				// }

				// Log.Info("Response middleware", roles.ResponseEncryption)
				if roles.isHttpServer {
					switch roles.ResponseDataType {
					case "protobuf":
						var res response.ResponseProtobufType
						getProtobufDataResponse, _ := c.Get("protobuf")
						// log.Info("getProtobufDataResponse", getProtobufDataResponse, roles)
						if getProtobufDataResponse == nil {
							getBodyDataResponse, _ := c.Get("body")
							if roles.ResponseEncryption {
								if getBodyDataResponse == nil {
									res.Code = 10001
									c.JSON(http.StatusOK, res.Encryption(userAesKey, res))
								} else {
									// 当需要加密的时候
									c.JSON(http.StatusOK, res.Encryption(userAesKey, getProtobufDataResponse))
								}
							} else {
								if getBodyDataResponse == nil {
									res.Code = 10001
									c.JSON(http.StatusOK, res.GetResponse())
								} else {
									c.JSON(http.StatusOK, getBodyDataResponse)
								}
							}
						} else {
							// fmt.Println("输出protobuf Res")
							if roles.ResponseEncryption {
								c.Writer.Header().Set("Content-Type", "application/x-protobuf")
								c.String(http.StatusOK, res.Encryption(userAesKey, getProtobufDataResponse))
								// fmt.Println("Response解析成功！！！！！！！！！！")
							} else {
								r := getProtobufDataResponse.(*response.ResponseType)

								protoData := protos.Encode(
									&protos.ResponseType{
										Code:        r.Code,
										Data:        r.Data.(string),
										Msg:         r.Msg,
										CnMsg:       r.CnMsg,
										Error:       r.Error,
										RequestId:   r.RequestId,
										RequestTime: r.RequestTime,
										Platform:    r.Platform,
										Author:      r.Author,
									},
								)

								// dataProto := new(protos.RequestType)
								// protos.DecodeBase64(protoData, dataProto)

								// log.Info("protoData", protoData)
								// log.Info("dataProto", dataProto)

								c.Writer.Header().Set("Content-Type", "application/x-protobuf")
								c.String(http.StatusOK,
									protoData)
							}
						}

					default:
						if roles.ResponseEncryption {
							// 当需要加密的时候
						} else {
							getResponse, _ := c.Get("body")
							c.JSON(http.StatusOK, getResponse)
						}
						break
					}
				}
			}()
			c.Next()
		} else {
			c.Next()
		}
	}
}

// fmt.Println(test.GetName())

// data, err := proto.Marshal(test)
// var msgData interface{}
// msgData = test
// msg, _ := proto.Marshal(msgData.(proto.Message))
// fmt.Println("msg", msg, "::::", string(msg))
// fmt.Println("data", data)
// // fmt.Println("data", string(data))
// if err != nil {
// 	log.Fatal("marshaling error: ", err)
// }
// newTest := &Student{}
// err = proto.Unmarshal(data, newTest)
// fmt.Println("newTest", newTest)
// if err != nil {
// 	log.Fatal("unmarshaling error: ", err)
// }
// // Now test and newTest contain the same data.
// if test.GetName() != newTest.GetName() {
// 	log.Fatalf("data mismatch %q != %q", test.GetName(), newTest.GetName())
// }
