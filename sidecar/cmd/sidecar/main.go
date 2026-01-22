package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	fmt.Fprintf(os.Stdout, "[sidecar] starting (pid=%d)\n", os.Getpid())

	sigs := make(chan os.Signal, 1)
	done := make(chan bool, 1)

	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-sigs
		fmt.Fprintf(os.Stdout, "\n [sidecar] received signal: %v\n", sig)
		done <- true
	}()

	fmt.Println("[sidecar] waiting for signals...")

	<-done

	fmt.Println("[sidecar] shutting down cleanly")
}
