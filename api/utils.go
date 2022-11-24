package backpack

import (
	"os"

	"github.com/golang/glog"
)

func getEnvMust(key string) string {
	value := os.Getenv(key)
	if value == "" {
		glog.Fatalf("Environment value '%s' is empty", key)
	}
	return value
}
