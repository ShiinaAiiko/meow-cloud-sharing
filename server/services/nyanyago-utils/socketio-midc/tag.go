package socketiomidc

func (c *SocketIoServer) saveTagRdb(namespace, kind, tag string, ids map[string]string) error {
	rKey := c.RDB.GetKey("NSocketIOTags")

	err := c.RDB.SetStruct(rKey.GetKey(namespace+kind+tag), &ids, rKey.GetExpiration())
	if err != nil {
		return err
	}
	return nil
}
func (c *ConnContext) GetTag(kind string) string {
	// log.Error("c.tags", c.tags)
	// log.Info("sasasasa", c.tags[kind])
	// log.Info("c.tags == nil", c.tags)
	if c.tags == nil {
		c.tags = map[string]string{}
	}
	return c.tags[kind]
}
func (c *ConnContext) SetTag(kind, tag string) error {
	// log.Info("-------SetTag--------")
	// log.Warn("kind, tag", kind, tag)
	if c.tags == nil {
		c.tags = map[string]string{}
	}
	c.tags[kind] = tag

	rKey := c.ServerContext.RDB.GetKey("NSocketIOTags")
	ids := map[string]string{}
	// log.Error(111111111, c.namespace, kind, tag, "kind, tag ids", c.tags, "kind, tag ids", ids)
	c.ServerContext.RDB.GetStruct(rKey.GetKey(c.namespace+kind+tag), &ids)
	// log.Error("err", err)
	// if err != nil {
	// 	return err
	// }
	// ids[tag] = c.id
	ids[c.ID()] = c.Conn.ID()
	// log.Error(c.namespace, kind, tag, "kind, tag ids", c.tags, "kind, tag ids", ids)
	c.ServerContext.saveTagRdb(c.namespace, kind, tag, ids)

	return nil
}

// 检索符合tag的coon
func (c *ConnContext) GetConnContextByTag(kind, tag string) []*ConnContext {
	rKey := c.ServerContext.RDB.GetKey("NSocketIOTags")
	ids := map[string]string{}
	conns := []*ConnContext{}
	err := c.ServerContext.RDB.GetStruct(rKey.GetKey(c.namespace+kind+tag), &ids)
	// log.Info("err", err, c.namespace+kind+tag)
	if err != nil {
		return conns
	}
	c.ServerContext.saveTagRdb(c.namespace, kind, tag, ids)
	// log.Error("ids", c.namespace, kind, tag, ids)
	for k, _ := range ids {

		conn := c.GetConnContextById(k)
		if conn == nil {
			continue
		}
		conns = append(conns, conn)
	}

	return conns
}

func (c *SocketIoServer) GetConnContextByTag(namespace string, kind, tag string) []*ConnContext {
	cc := ConnContext{
		ServerContext: c,
		namespace:     namespace,
	}
	return cc.GetConnContextByTag(kind, tag)
}

// func (c *SocketIoServer) GetConnContextByTag(namespace string, kind, tag string) []*ConnContext {
// 	cc := ConnContext{
// 		ServerContext: c,
// 		namespace:     namespace,
// 	}
// 	return cc.GetConnContextByTag(kind, tag)
// }
