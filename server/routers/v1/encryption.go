package routerV1

import (
	controllersV1 "github.com/ShiinaAiiko/meow-cloud-sharing/server/controllers/v1"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/middleware"
)

func (r Routerv1) InitEncryption() {
	//  /encryption/rsapublickey
	//  /encryption/rsakey
	enc := new(controllersV1.EncryptionController)

	role := middleware.RoleMiddlewareOptions{
		BaseUrl: r.BaseUrl,
	}
	r.Group.POST(role.SetRole(apiUrl["encryptionExchangeKey"], &middleware.RoleOptionsType{
		Authorize:          true,
		RequestEncryption:  true,
		ResponseEncryption: true,
		CheckAppId:         true,
		ResponseDataType:   "protobuf",
	}), enc.ExchangeKey)

	// r.Group.POST(role.SetRole("/encryption/rsapublickey/get", &middleware.RoleOptionsType{
	// 	Authorize:          true,
	// 	RequestEncryption:  true,
	// 	ResponseEncryption: true,
	// 	ResponseDataType:   "protobuf",
	// }), enc.GetRsaPublicKey)

	// r.Group.POST(role.SetRole("/encryption/rsapublickey/post", &middleware.RoleOptionsType{
	// 	Authorize:          true,
	// 	RequestEncryption:  true,
	// 	ResponseEncryption: true,
	// 	ResponseDataType:   "protobuf",
	// }), enc.PostClientRsaPublicKeAndGenerateDhKey)

	// r.Group.POST(role.SetRole("/encryption/aeskey/post", &middleware.RoleOptionsType{
	// 	Authorize:          true,
	// 	RequestEncryption:  true,
	// 	ResponseEncryption: true,
	// 	ResponseDataType:   "protobuf",
	// }), enc.GetAesKey)

}
