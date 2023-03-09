package dbxV1

import (
	"context"

	"github.com/ShiinaAiiko/meow-cloud-sharing/server/models"
	"go.mongodb.org/mongo-driver/bson"
)

type AppDbx struct {
}

func (d *AppDbx) CreateApp(name string, avatar string) (*models.App, error) {
	app := models.App{
		Avatar: avatar,
		Name:   name,
	}
	if err := app.Default(); err != nil {
		return nil, err
	}
	_, err := app.GetCollection().InsertOne(context.TODO(), app)
	if err != nil {
		return nil, err
	}
	return &app, nil
}

func (cr *AppDbx) GetAppByName(name string) *models.App {
	// 后续启用redis
	app := new(models.App)

	filter := bson.M{
		"name": name,
	}
	err := app.GetCollection().FindOne(context.TODO(), filter).Decode(app)
	if err != nil {
		return nil
	}
	return app
}
