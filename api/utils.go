package backpack

import (
	"net/url"
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

func urlParseMust(rawurl string) *url.URL {
	u, err := url.Parse(rawurl)
	if err != nil {
		glog.Fatalf("Error parsing URL '%s': %s", rawurl, err)
	}
	return u
}
