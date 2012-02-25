/*
 * gitw-http.go - simple utility that shows gitw projects and the checkout,
 *                build and test statuses
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
	"io"
	"net/http"
	"log"
	"encoding/gob"
	"strings"
    "strconv"
	"encoding/json"
	"fmt"
	"os"
	"io/ioutil"
    "text/template"
    "html"
)

type LongTestConfig struct {
    Executable      string
    FollowChildren  string
}

type Repository struct {
    Repository      string
    Source          string
    Name            string
    Location        string
    Build           string
    Test            string
    LongTest        LongTestConfig
    OutputDirectory string
    NotifyEmail     string
    CommitMessage   string
    Description     string
    CommitNumber    int
    CheckoutSucc    bool
    BuildSucc       bool
    TestSucc        bool
    Touched         bool
    LongTestRunning bool
}

type SystemSnapshot struct {
    Name        string
    Pid         int
    CpuUsage    int
    MemoryUsage int
    OpenFiles   int
}

func LoadRepository(configFile string) Repository {

	r := strings.NewReader(configFile)
	decoder := json.NewDecoder(r)

	repo := Repository{}
	e := decoder.Decode(&repo)
	if e != nil {
		fmt.Printf("Error decoding repository configuration from file: %s\n", e)
	}
	return repo
}

func LoadSystemSnapshot(fileName string) *SystemSnapshot {
	gob.Register(&SystemSnapshot{})

    snapshotText, err := ioutil.ReadFile(fileName)
    if err != nil {
        fmt.Printf("Unable to open system snapshot output file: %s\n", err.Error())
        return nil
    }
	r := strings.NewReader(string(snapshotText))
	decoder := json.NewDecoder(r)

	snapshot := SystemSnapshot{}
	e := decoder.Decode(&snapshot)
	if e != nil {
		fmt.Printf("Error decoding repository configuration from file: %s\n", e)
	}
	return &snapshot
}

func LoadRepositories(configDir string) []Repository {
	gob.Register(&Repository{})
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


func (repository *Repository) AnalyzeCheckut() bool  {
	out, err := ioutil.ReadFile(repository.OutputDirectory + "/" + repository.Name + "-checkout-output.txt")

	if err != nil {
        fmt.Printf(":: Error opening checkout output for '%s': %s\n", repository.Name, err.Error())
        repository.CheckoutSucc = false
		return false
	}
    out_str := string(out)
    line_n := 0
    line := []byte{}
    for _, ch := range(out_str) {

        ch_int := int(ch)
        if ch_int == 0 {
            continue
        }
        if ch_int == 10 || ch_int == 13 {
            line_n++
            if line_n == 3 {
                break
            }
            line = []byte{}
        }
        line = append(line, byte(ch))
    }
    tokens := strings.Split(string(line), "|")
    if len(tokens) >= 2 {
        repository.CommitNumber, err = strconv.Atoi(tokens[0][1:len(tokens[0])])
        if err != nil {
            fmt.Printf(":: NOTE - error reading comit number: %s\n", err.Error())
        }
        repository.CommitMessage = tokens[1]
    }
	if strings.Index(out_str, "succ") == 0 {
        repository.CheckoutSucc = true
		return true
	}
    repository.CheckoutSucc = false
	return false
}

func (repository *Repository) AnalyzeBuild() bool {
	out, err := ioutil.ReadFile(repository.OutputDirectory + "/" + repository.Name + "-build-output.txt")
	if err != nil {
        fmt.Printf(":: Error opening build output for '%s': %s\n", repository.Name, err.Error())
        repository.BuildSucc = false
		return false
	}
	if strings.Index(string(out), "succ") == 0 {
        repository.BuildSucc = true
		return true
	}
    repository.BuildSucc = false
	return false
}

func (repository *Repository) AnalyzeTest() bool {
	out, err := ioutil.ReadFile(repository.OutputDirectory + "/" + repository.Name + "-test-output.txt")
	if err != nil {
        fmt.Printf(":: Error opening build output for '%s': %s\n", repository.Name, err.Error())
        repository.TestSucc = false
		return false
	}
	if strings.Index(string(out), "succ") == 0 {
        repository.TestSucc = true
		return true
	}
    repository.TestSucc = false
    return false
}

func (repository *Repository) WasTouched() bool {
    logFilename := fmt.Sprintf("%s/%s-checkout-output.txt", repository.OutputDirectory, repository.Name)
    _, err := os.Stat(logFilename)
    if err != nil {
        return false
    }
    repository.Touched = true
    return true
}

func ViewLog(w http.ResponseWriter, req *http.Request) {
    // how to get url arguments:
    //fmt.Fprintf(w, "Hello, %q", html.EscapeString(req.URL.RawQuery))
    path := strings.SplitN(html.EscapeString(req.URL.Path[1:]), "/", 3)
    if len(path) < 3 {
        fmt.Fprintf(w, "Invalid url")
        return
    }

    name, log := path[1], path[2]
    if log != "build" && log != "checkout" && log != "test" {
        fmt.Fprintf(w, "Log not valid, must be either build, checkout or test")
        return
    }
    found := false
    log_filename := ""
    fmt.Printf("Showing %s for repository %s\n", log, name)
    repositories := LoadRepositories("repositories")
    for _, repository := range repositories {
        if repository.Name == name {
            log_filename = fmt.Sprintf("%s/%s-%s-output.txt", repository.OutputDirectory, repository.Name, log)
            found = true
            break
        }
    }
    if !found {
        fmt.Fprintf(w, "Invalid repository '%s'", name)
        return
    }
    log_file, err := ioutil.ReadFile(log_filename)
    if err != nil {
        fmt.Fprintf(w, "Error opening log file: %s", err.Error())
    }
    out := fmt.Sprintf("%s", string(log_file))
    io.WriteString(w, out)
}

func ViewLongRun(w http.ResponseWriter, req *http.Request) {
    path := strings.SplitN(html.EscapeString(req.URL.Path[1:]), "/", 3)
    if len(path) != 2 {
        fmt.Fprintf(w, "Invalid url")
        return
    }

    name := path[1]
    found := false
    log_filename := ""
    repositories := LoadRepositories("repositories")
    for _, repository := range repositories {
        if repository.Name == name {
            log_filename = fmt.Sprintf("%s/%s-system-output.txt", repository.OutputDirectory, repository.Name)
            found = true
            break
        }
    }
    if !found {
        fmt.Fprintf(w, "Invalid repository '%s'", name)
        return
    }
    /*
    log_file, err := ioutil.ReadFile(log_filename)
    if err != nil {
        fmt.Fprintf(w, "Error opening log file: %s", err.Error())
    }
    */
    snapshot := LoadSystemSnapshot(log_filename)
    templ, err := template.ParseFiles("template-longrun.html")
    if err != nil {
        io.WriteString(w, err.Error())
    } else {
        templ.Execute(w, snapshot)
    }
}

func GetLongTest(w http.ResponseWriter, req *http.Request) {
    path := strings.SplitN(html.EscapeString(req.URL.Path[1:]), "/", 3)
    if len(path) != 2 {
        fmt.Fprintf(w, "Invalid url")
        return
    }

    name := path[1]
    found := false
    log_filename := ""
    repositories := LoadRepositories("repositories")
    for _, repository := range repositories {
        if repository.Name == name {
            log_filename = fmt.Sprintf("%s/%s-system-output.txt", repository.OutputDirectory, repository.Name)
            found = true
            break
        }
    }
    if !found {
        fmt.Fprintf(w, "Invalid repository '%s'", name)
        return
    }
    log_file, err := ioutil.ReadFile(log_filename)
    if err != nil {
        fmt.Fprintf(w, "Error opening log file: %s", err.Error())
    }
    io.WriteString(w, string(log_file))
}
func Index(w http.ResponseWriter, req *http.Request) {

    templ, err := template.ParseFiles("template.html")
    if err != nil {
        io.WriteString(w, err.Error())
    } else {
        repositories := LoadRepositories("repositories")
        for i := 0; i < len(repositories); i++ {
            if repositories[i].WasTouched() {
                repositories[i].AnalyzeCheckut()
                repositories[i].AnalyzeBuild()
                repositories[i].AnalyzeTest()
                repositories[i].LongTestRunning = true
            }
        }
        templ.Execute(w, &repositories)
    }
}

func main() {
	http.HandleFunc("/", Index)
	http.HandleFunc("/viewlog/", ViewLog)
	http.HandleFunc("/longrun/", ViewLongRun)
	http.HandleFunc("/getlongtest/", GetLongTest)

    // serve static files on port 12346
    go http.ListenAndServe(":12346", http.FileServer(http.Dir("static")))
    // and the web interface on port 12345
	err := http.ListenAndServe(":12345", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
