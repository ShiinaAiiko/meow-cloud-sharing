package socketiomidc

// 设置自定义ID
func (c *ConnContext) init() {
	c.id = c.Conn.ID()

	c.initSocketsMap()
	c.ServerContext.sockets[c.namespace][c.id] = c
	// log.Info("init", c.namespace, c.id, "qian id", c.ServerContext.sockets[c.namespace][c.id])
}
func (c *ConnContext) ID() string {
	return c.id
}

// 设置自定义ID
func (c *ConnContext) SetID(id string) {

	c.initSocketsMap()
	// c.id = id
	c.ServerContext.sockets[c.namespace][id] = c

	// 如果socket没了，要删除，未来
}

func (c *ConnContext) Clear(customId string) {
	// log.Info("-----------Clear------------")
	rKey := c.ServerContext.RDB.GetKey("NSocketIOTags")

	cc := c.GetConnContextById(customId)
	// cc := c.GetConnContextById(c.Conn.ID())
	// log.Error(c.namespace, c.ServerContext.sockets[c.namespace], c.id)
	// log.Info("c.tags ", cc, cc.ID())
	if cc != nil {
		// log.Info("c.tags ", cc.tags)
		for k, v := range cc.tags {
			// log.Info("c.tags", cc.tags, k, v, cc.namespace+k+v)
			// c.namespace+kind+tag
			err := c.ServerContext.RDB.Delete(rKey.GetKey(cc.namespace + k + v))
			if err != nil {
				// log.Info(err)
			}
			// log.Info(err)
			// log.Info(1111111, cc.GetConnContextByTag(k, v))
		}
		cc.ClearSessionCache()
	}
	delete(c.ServerContext.sockets[c.namespace], c.id)

}

func (c *ConnContext) initSocketsMap() {
	if c.ServerContext.sockets[c.namespace] == nil {
		c.ServerContext.sockets[c.namespace] = make(socketsNamespaceType)
	}

	// if c.ServerContext.connContextMap[c.namespace] == nil {
	// 	c.ServerContext.connContextMap[c.namespace] = map[string](map[string]*ConnContext){}
	// }
	// if c.ServerContext.connContextMap[c.namespace]["id"] == nil {
	// 	c.ServerContext.connContextMap[c.namespace]["id"] = map[string]*ConnContext{}
	// }
}

func (c *ConnContext) GetConnContextById(id string) *ConnContext {
	nsMap := c.ServerContext.sockets[c.namespace]
	if nsMap == nil || nsMap[id] == nil || nsMap[id].Conn == nil {
		return nil
	}
	return c.ServerContext.sockets[c.namespace][id]
}

func (c *SocketIoServer) GetConnContext(namespace, id string) *ConnContext {
	nsMap := c.sockets[namespace]
	if nsMap == nil || nsMap[id] == nil || nsMap[id].Conn == nil {
		return nil
	}
	return c.sockets[namespace][id]
}

// func (c *ConnContext) SetCustomId(uid, tag string) error {
// 	rKey := c.ServerContext.RDB.GetKey("NSocketIOCustomId")
// 	customIds := map[string]string{}
// 	err := c.ServerContext.RDB.GetStruct(rKey.GetKey(nstrings.ToString(uid)), &customIds)
// 	if err != nil {
// 		return err
// 	}
// 	customIds[tag] = c.Conn.ID()

// 	err = c.ServerContext.RDB.SetStruct(rKey.GetKey(c.namespace+"_"+nstrings.ToString(uid)), &customIds, rKey.GetExpiration())
// 	if err != nil {
// 		return err
// 	}
// 	c.SetCustomId(customIds[tag])
// 	return nil
// }

// func (s *SocketIoServer) SetCustomId(namespace, uid, tag string) error {
// 	rKey := s.RDB.GetKey("NSocketIOCustomId")
// 	CustomIds := map[string]string{}
// 	err := s.RDB.GetStruct(rKey.GetKey(nstrings.ToString(uid)), &CustomIds)
// 	if err != nil {
// 		return err
// 	}
// 	CustomIds[tag] = cipher.MD5(namespace + "_" + nstrings.ToString(uid) + "_" + tag)

// 	err = s.RDB.SetStruct(rKey.GetKey(namespace+"_"+nstrings.ToString(uid)), &CustomIds, rKey.GetExpiration())
// 	if err != nil {
// 		return err
// 	}
// 	return nil
// }
// func (s *SocketIoServer) GetCustomIds(namespace, uid string) map[string]string {
// 	rKey := s.RDB.GetKey("NSocketIOCustomId")
// 	CustomIds := map[string]string{}
// 	err := s.RDB.GetStruct(rKey.GetKey(namespace+"_"+nstrings.ToString(uid)), &CustomIds)
// 	if err != nil {
// 		return map[string]string{}
// 	}
// 	// 续期
// 	return CustomIds
// }
// func (s *SocketIoServer) GetCustomId(namespace, uid, tag string) string {
// 	rKey := s.RDB.GetKey("NSocketIOCustomId")
// 	CustomIds := map[string]string{}
// 	err := s.RDB.GetStruct(rKey.GetKey(namespace+"_"+nstrings.ToString(uid)), &CustomIds)
// 	if err != nil {
// 		return ""
// 	}
// 	// 续期
// 	return CustomIds[tag]
// }
