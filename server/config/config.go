package conf

import (
	"encoding/json"
	"os"

	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/typings"

	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/cherrai/nyanyago-utils/saass"
	sso "github.com/cherrai/saki-sso-go"
)

var (
	Config *typings.Config
	SSO    *sso.SakiSSO
	SAaSS  *saass.SAaSS
	// SSOList map[string]*sso.SakiSSO = map[string]*sso.SakiSSO{}
	Log = nlog.New()
	// Log = nlog.Nil()
)

var log = Log

// func GetSSO(appId string) *sso.SakiSSO {
// 	return SSOList[appId]
// }

func GetConfig(configPath string) {
	jsonFile, _ := os.Open(configPath)

	defer jsonFile.Close()
	decoder := json.NewDecoder(jsonFile)

	conf := new(typings.Config)
	//Decode从输入流读取下一个json编码值并保存在v指向的值里
	err := decoder.Decode(&conf)
	if err != nil {
		log.Error("Error:", err)
	}
	Config = conf
}
