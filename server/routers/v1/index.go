package routerV1

import (
	"github.com/gin-gonic/gin"
)

type Routerv1 struct {
	Engine  *gin.Engine
	Group   *gin.RouterGroup
	BaseUrl string
}

func (r Routerv1) Init() {
	r.Group = r.Engine.Group(r.BaseUrl)
	r.InitSAaSS()
}
