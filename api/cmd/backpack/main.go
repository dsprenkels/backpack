package main

import (
	bp "backpack"
	"flag"
	"fmt"
	"os"
)

type envHelpLine struct {
	Key, Help string
	Required  bool
}

var envHelp []envHelpLine = []envHelpLine{
	{"GIN_MODE", "gin mode, set to 'debug' or 'release'", false},
	{"BACKPACK_DB_URL", "postgresql database connection specifier or url", true},
	{"BACKPACK_SESSION_SECRET", "global session secret", true},
	{"BACKPACK_GITHUB_CLIENT_ID", "github oauth client id", true},
	{"BACKPACK_GITHUB_CLIENT_SECRET", "github oauth client secret", true},
	{"BACKPACK_ROOT_URL", "root url", true},
	{"PORT", "port on which to listen for connections", false},
}

func usage() {
	fmt.Fprintf(os.Stderr, "Usage of %s:\n", os.Args[0])
	flag.PrintDefaults()
	fmt.Fprintln(os.Stderr)
	fmt.Fprintf(os.Stderr, "Environment variables:\n")
	for _, line := range envHelp {
		fmt.Fprintf(os.Stderr, "  %s\n        %s\n", line.Key, line.Help)
	}
}

func main() {
	flag.Usage = usage
	flag.Parse()

	// Check if all required environment variables were set
	for _, line := range envHelp {
		if _, prs := os.LookupEnv(line.Key); line.Required && !prs {
			fmt.Fprintf(os.Stderr, "environment variable is not set: %s", line.Key)
			usage()
			os.Exit(2)
		}
	}

	cfg := bp.AppConfig{}
	bp.App(&cfg)
}
