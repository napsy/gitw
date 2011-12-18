/*
 * gitw.go - simple utility that watches over local GIT repositores
 *           and if a commit is detected, checks out the sources and
 *           builds the project.
 *
 * version 0.1
 *
 * Copyright (c) 2011, Luka Napotnik <luka.napotnik@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *   * Neither the name of the <organization> nor the
 *     names of its contributors may be used to endorse or promote products
 *     derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


package main

import (
	"encoding/json"
	"os"
	"os/exec"
	"io/ioutil"
	"fmt"
	"encoding/gob"
	"net/smtp"
	"strings"
	"exp/inotify"
)

type Config struct {
	RepositoriesRoot string
	MailAddress string
	MailHost string
	MailUsername string
	MailPassword string
}

var GlobalConfig Config

type Repository struct {
	Name string
	Location string
	Build string
	OutputDirectory string
	NotifyEmail string
}

func (repository Repository) Checkout() (string, bool) {
	ok := true
	status := []byte("succ\n\n")
	tmpDir, _ := ioutil.TempDir(os.TempDir(), ".gitw-checkout-")
	fmt.Printf(":: Checking out '%s' in %s\n", repository.Name, tmpDir)

	cmd := exec.Command("git", "clone", repository.Location, tmpDir)
	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("Erorr running git: %s\n", err)
		status = []byte("fail\n\n")
		ok = false
	}
	status = append(status, output...)
	err = ioutil.WriteFile(repository.OutputDirectory + repository.Name + "-checkout-output.txt", status, 0644)
	if err != nil {
		fmt.Printf("Error writing checkout output to file: %s\n", err)
	}
	return tmpDir, ok
}

func (repository Repository) BuildCheckout(tmpDir string) bool {
	ok := true
	fmt.Printf(":: Building '%s'\n", repository.Name)
	status := []byte("succ\n\n")
	cmd := exec.Command(repository.Build)
	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("Erorr running %s: %s\n", repository.Build, err)
		status = []byte("fail\n\n")
		ok = false
	}
	status = append(status, output...)

	err = ioutil.WriteFile(repository.OutputDirectory + repository.Name + "-build-output.txt", status, 0644)
	if err != nil {
		fmt.Printf("Error writing checkout output to file: %s\n", err)
	}
	return ok
}

func SendMailNotification(repository *Repository, message string) {
	str := "From: gitw mail notification service <" + GlobalConfig.MailAddress + ">\nTo: Repository Owner <" + repository.NotifyEmail + ">\nSubject: [" + repository.Name + "] error notification\n\nSomething went wrong while handling the repository '" + repository.Name + "'. Please check the output log files!\n"
	auth := smtp.PlainAuth(GlobalConfig.MailUsername, GlobalConfig.MailUsername, GlobalConfig.MailPassword, GlobalConfig.MailHost)
	err := smtp.SendMail(GlobalConfig.MailHost + ":25", auth, GlobalConfig.MailAddress, []string{repository.NotifyEmail}, []byte(str))
	if err != nil {
		fmt.Printf("Error sending mail: %s\n", err)
	}
}
func ReadConfig() {
	gob.Register(&Config{})

	config, err := ioutil.ReadFile("config.json")
	if err != nil {
		fmt.Println("Unable to read configuration from file!")
		return
	}
	r := strings.NewReader(string(config))
	decoder := json.NewDecoder(r)

	e := decoder.Decode(&GlobalConfig)
	if e != nil {
		fmt.Printf("Error decoding gitw configuration from file: %s\n", e)
	}
}

func LoadRepository(configFile string) Repository {

	gob.Register(&Repository{})
	r := strings.NewReader(configFile)
	decoder := json.NewDecoder(r)

	repo := Repository{}
	e := decoder.Decode(&repo)
	if e != nil {
		fmt.Printf("Error decoding repository configuration from file: %s\n", e)
	}
	return repo
}

func LoadRepositories(configDir string) []Repository {
	repositories := make([]Repository, 0)

	if configDir[0] != '/' { // have relative path
		cwd, _ := os.Getwd()
		configDir = cwd + "/" + configDir
	}
	fmt.Printf(":: Reading repositories from '%s' ...\n", configDir)
	ctx, err := ioutil.ReadDir(configDir)
	if err != nil {
		fmt.Printf("Error reading configuration directory: %s\n", err)
		return nil
	}
	for _, file := range ctx {
		if file.Mode().IsDir() {
			continue
		}
		if strings.HasSuffix(file.Name(), ".json") == false {
			continue
		}
		fileCtx, err := ioutil.ReadFile(configDir + "/" + file.Name())
		if err != nil {
			fmt.Printf("Error reading repository configuration from '%s': %s\n", file.Name(), err)
			continue
		}
		repository := LoadRepository(string(fileCtx))
		repositories = append(repositories, repository)
	}
	return repositories
}


func TestLoadRepository() bool {
sampleConfig := `
{
	"name"		: "testing",
	"location"	: "/home/luka/git/tarock.git",
	"build"		: "gomake",
	"outputdirectory" : "/home/luka/gitw/",
	"notifyemail" : "joe@example.com"
}
	`
	expectedRepository := Repository{"testing", "/home/luka/git/tarock.git", "gomake", "/home/luka/gitw/", "joe@example.com"}
	repository := LoadRepository(sampleConfig)
	if repository != expectedRepository {
		return false
	}
	return true
}

func RepositoryWatchdog(repositories []Repository) {
	watcher, err := inotify.NewWatcher()
	gitWatchFile := "/refs/heads/master"
	if err != nil {
		fmt.Printf("Error creating new inotify watcher: %s\n", err)
		return
	}
	for _, repository := range repositories {
		fmt.Printf(":: Adding repository '%s' to watchlist\n", repository.Name)
		err = watcher.AddWatch(repository.Location + gitWatchFile, inotify.IN_MODIFY)
		if err != nil {
			fmt.Printf("Error watching '%s': %s\n", repository.Location, err)
			return
		}
	}

	for {
		select {
			case ev := <-watcher.Event:
				for _, repository := range repositories {
					skipIdx := strings.Index(ev.Name, gitWatchFile)
					if repository.Location == ev.Name[:skipIdx] {
						tmpDir, ok1 := repository.Checkout()
						ok2 := repository.BuildCheckout(tmpDir)
						if ok1 == false || ok2 == false {
							fmt.Printf(":: Sending error notification message to '%s' (repository '%s' failed)...\n", repository.NotifyEmail, repository.Name)
							SendMailNotification(&repository, "")
						}
						break
					}
				}
			case err := <-watcher.Error:
				fmt.Printf("Watch error: %s\n", err)
		}
	}
}
func main() {
	// Some self-tests
	if TestLoadRepository() == false {
		fmt.Println("TestLoadRepository failed!")
	}

	ReadConfig()
	// Load repository information form JSON configuration files
	repositories := LoadRepositories(GlobalConfig.RepositoriesRoot)
	// Run the watchdog loop
	RepositoryWatchdog(repositories)
}
