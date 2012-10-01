/*
 * gitw.go - simple utility that watches over local GIT repositores
 *           and if a commit is detected, checks out the sources and
 *           builds the project.
 *
 * version 0.1
 *
 * Copyright (c) 2012, Luka Napotnik <luka.napotnik@gmail.com>
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
    "net"
    "./inotify"
)

type Config struct {
    RepositoriesRoot    string
    MailAddress         string
    MailHost            string
    MailUsername        string
    MailPassword        string
}

var GlobalConfig Config

type Repository struct {
    Repository      string
    Source          string
    Name            string
    Location        string
    Build           string
    Test            string
    OutputDirectory string
    NotifyEmail     string
    Filename        string
    Branch          string
}

var cwd string
func (repository Repository) Checkout(revision, message string) (string, bool) {
    var cmd *exec.Cmd
    ok := true
    tmpDir, _ := ioutil.TempDir(os.TempDir(), ".gitw-checkout-")
    fmt.Printf(":: Checking out '%s' in %s\n", repository.Name, tmpDir)

    switch repository.Repository {
    case "git":
        if len(repository.Branch) > 0 {
            cmd = exec.Command("git", "clone", "-b", repository.Branch, repository.Location, tmpDir)
        } else {
            cmd = exec.Command("git", "clone", repository.Location, tmpDir)
        }
    case "svn":
        cmd = exec.Command("svn", "checkout", repository.Location, tmpDir)
    default:
        fmt.Printf("Unknown repository type '%s'.\n", repository.Repository);
        return "", false
    }

    header := fmt.Sprintf("%s|%s\n", revision, message)
    status := []byte{}

    filename := repository.OutputDirectory + repository.Name + "-checkout-output.txt"

    output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("Erorr running git: %s\n", err)
		ok = false
	}
    if ok {
	    status = append(status, []byte("succ\n\n")...)
    } else {
	    status = append(status, []byte("fail\n\n")...)
    }
	status = append(status, []byte(header)...)
	status = append(status, output...)
	err = ioutil.WriteFile(filename, status, 0644)
	if err != nil {
		fmt.Printf("Error writing checkout output to file: %s\n", err)
	}
	return tmpDir, ok
}

func (repository Repository) BuildCheckout(tmpDir string) bool {
	ok := true
	fmt.Printf(":: Building '%s'\n", repository.Name)
	status := []byte("succ\n\n")
    os.Chdir(tmpDir)

    filename := repository.OutputDirectory + repository.Name + "-build-output.txt"
	cmd := exec.Command(repository.Build)
	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("Error running %s: %s\n", repository.Build, err)
		status = []byte("fail\n\n")
		ok = false
	}
	status = append(status, output...)

	err = ioutil.WriteFile(filename, status, 0644)
	if err != nil {
		fmt.Printf("Error writing checkout output to file: %s\n", err)
	}
	return ok
}

func (repository Repository) RunTest(tmpDir string) bool {
    if len(repository.Test) < 1 {
        return true
    }
	ok := true
	fmt.Printf(":: Running tests for '%s'\n", repository.Name)
	status := []byte("succ\n\n")
    os.Chdir(tmpDir)
    if strings.Index(repository.Test, "{TMPDIR}") == 0 {
        repository.Test = tmpDir + repository.Test[8:]
    }

    filename := repository.OutputDirectory + repository.Name + "-test-output.txt"

	cmd := exec.Command(repository.Test, tmpDir)
	output, err := cmd.CombinedOutput()
    fmt.Println("Command ended ..")
	if err != nil {
		fmt.Printf("Erorr running %s: %s\n", repository.Test, err)
		status = []byte("fail\n\n")
		ok = false
	}
    fmt.Println(string(output))
	status = append(status, output...)

	err = ioutil.WriteFile(filename, status, 0644)
	if err != nil {
		fmt.Printf("Error writing checkout output to file: %s\n", err)
	}
	return ok
}

func (repository Repository) RunLongTest(tmpDir string) bool {
    if len(repository.Test) < 1 {
        return true
    }
	ok := true
	fmt.Printf(":: Running long tests for '%s'\n", repository.Name)
	status := []byte("succ\n\n")
    os.Chdir(cwd)

    filename := repository.OutputDirectory + repository.Name + "-gitw-longtest-output.txt"

    fmt.Printf("Repository filename: %s, tmpDir: %s\n", repository.Filename, tmpDir)
	cmd := exec.Command(cwd + "/gitw-test", repository.Filename, tmpDir)
	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("Erorr running gitw-test tool: %s\n", err.Error())
		status = []byte("fail\n\n")
		ok = false
	}
    fmt.Println(string(output))
	status = append(status, output...)

	err = ioutil.WriteFile(filename, status, 0644)
	if err != nil {
		fmt.Printf("Error writing checkout output to file: %s\n", err)
	}
	return ok
}

func SendMailNotification(repository *Repository, message string) {
	str := "From: gitw mail notification service <" + GlobalConfig.MailAddress + ">\nTo: Repository Owner <" + repository.NotifyEmail + ">\nSubject: [" + repository.Name + "] error notification\n\nSomething went wrong while handling the repository '" + repository.Name + "'. Please check the output log files!\n"
	auth := smtp.PlainAuth(GlobalConfig.MailUsername, GlobalConfig.MailUsername, GlobalConfig.MailPassword, GlobalConfig.MailHost)
	err := smtp.SendMail(GlobalConfig.MailHost + ":587", auth, GlobalConfig.MailAddress, []string{repository.NotifyEmail}, []byte(str))
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
        fmt.Printf("ReadConfig: error decoding gitw configuration from file: %s\n", e)
	}
}

func LoadRepository(configFile string) Repository {

	gob.Register(&Repository{})
	r := strings.NewReader(configFile)
	decoder := json.NewDecoder(r)

	repo := Repository{}
	e := decoder.Decode(&repo)
	if e != nil {
        fmt.Printf("LoadRepository: error decoding repository configuration from file: %s\n", e)
	}
    if idx := strings.Index(repo.Source, "/"); idx > -1 {
        repo.Branch = repo.Source[idx + 1:]
        repo.Source = repo.Source[:idx]
        fmt.Println(repo)
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
        repository.Filename = configDir + "/" + file.Name()
		repositories = append(repositories, repository)
	}
	return repositories
}


func TestLoadRepository() bool {
sampleConfig := `
{
    "repository": "git",
    "source"    : "local",
	"name"		: "testing",
	"location"	: "/home/luka/git/tarock.git",
	"build"		: "gomake",
    "test"      : "test.sh",
	"outputdirectory" : "/home/luka/gitw/",
	"notifyemail" : "joe@example.com",
    "FileName"  : "filename"
}
	`
    expectedRepository := Repository{"git", "local", "testing", "/home/luka/git/tarock.git", "gomake", "test.sh", "/home/luka/gitw/", "joe@example.com", "filename", ""}
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

        if repository.Source == "remote" {
            continue
        }
		fmt.Printf(":: Adding repository '%s' to watchlist\n", repository.Name)
		err = watcher.AddWatch(repository.Location + gitWatchFile, inotify.IN_CLOSE_WRITE)
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
						tmpDir, ok1 := repository.Checkout("0", "")
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

func (repository Repository) CleanOutputDirectory() {
    longTestFilename := repository.OutputDirectory + repository.Name + "-gitw-longtest-output.txt"
    testFilename := repository.OutputDirectory + repository.Name + "-test-output.txt"
    checkoutFilename := repository.OutputDirectory + repository.Name + "-checkout-output.txt"
    buildFilename := repository.OutputDirectory + repository.Name + "-build-output.txt"

    if err := os.Remove(longTestFilename); err != nil {
        fmt.Printf(":: Error removing longtest output file for '%s': %s\n", repository.Name, err)
    }
    if err := os.Remove(testFilename); err != nil {
        fmt.Printf(":: Error removing test output file for '%s': %s\n", repository.Name, err)
    }
    if err := os.Remove(checkoutFilename); err != nil {
        fmt.Printf(":: Error removing checkout output file for '%s': %s\n", repository.Name, err)
    }
    if err := os.Remove(buildFilename); err != nil {
        fmt.Printf(":: Error removing build output file for '%s': %s\n", repository.Name, err)
    }
}

func RemoteRepositoryWatchdog(repositories []Repository) {
    netlisten, err := net.Listen("tcp", ":9988")
    if err != nil {
        panic(err.Error())
    }
    defer netlisten.Close()

    for {
        conn, err := netlisten.Accept()
        if err != nil {
            panic(err.Error())
        }
        bytes := make([]byte, 1024)
        conn.Read(bytes)
        line := string(bytes)
        idx := strings.IndexRune(line, '\r')
        if idx != -1 {
            line = line[:idx]
        }
        tokens := strings.Split(line, "|")
        if len(tokens) < 3 {
            fmt.Printf(":: Invalid line from client '%s', skipping ...\n", line)
            continue
        }
        r, rev, msg := tokens[0], tokens[1], tokens[2]
        found := false
        for _, repository := range repositories {
            if strings.Index(repository.Location, r) != -1 {
                repository.CleanOutputDirectory()
                ok3 := true
                tmpDir, ok1 := repository.Checkout(rev, msg)
                ok2 := repository.BuildCheckout(tmpDir)
                if len(repository.Test) > 0 {
                    ok3 = repository.RunTest(tmpDir)
                }
                if ok1 == false || ok2 == false || ok3 == false {
                    fmt.Printf(":: Sending error notification message to '%s' (repository '%s' failed)...\n", repository.NotifyEmail, repository.Name)
                    SendMailNotification(&repository, "")
                }

                go repository.RunLongTest(tmpDir)
                /*
                } else {
                    err := os.RemoveAll(tmpDir)
                    if err != nil {
                        fmt.Printf(":: Error removing temporary directory '%s'\n", tmpDir)
                    }
                }
                */
                // Remove the temporary directory

                fmt.Printf(":: Done with '%s'\n", repository.Name)
                found = true
                break
            }
        }
        if found != true {
            fmt.Printf("NOTE: repository '%s' was not found.\n", r);
        }
        conn.Close()
    }
}

func main() {
    cwd, _ = os.Getwd()
	// Some self-tests
	if TestLoadRepository() == false {
		fmt.Println("TestLoadRepository failed!")
	}

	ReadConfig()
	// Load repository information form JSON configuration files
	repositories := LoadRepositories(GlobalConfig.RepositoriesRoot)
	// Run the watchdog loop
    go RemoteRepositoryWatchdog(repositories);
	RepositoryWatchdog(repositories)
}
