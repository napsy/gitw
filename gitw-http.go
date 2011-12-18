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
	"encoding/json"
	"fmt"
	"os"
	"io/ioutil"
)

type Repository struct {
	Name string
	Location string
	Build string
	OutputDirectory string
	NotifyEmail string
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


func AnalyzeCheckut(repository Repository) bool {
	out, err := ioutil.ReadFile(repository.Name + "-checkout-output.txt")
	if err != nil {
		return false
	}
	if strings.Index(string(out), "succ") == 0 {
		return true
	}
	return false
}

func AnalyzeBuild(repository Repository) bool {
	out, err := ioutil.ReadFile(repository.Name + "-buildt-output.txt")
	if err != nil {
		return false
	}
	if strings.Index(string(out), "succ") == 0 {
		return true
	}
	return false
}

func AnalyzeTest(repository Repository) bool {
	return false
}

func ViewLog(w http.ResponseWriter, req *http.Request) {
	io.WriteString(w, req.URL.RawQuery)
}

func Index(w http.ResponseWriter, req *http.Request) {
index := `<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html><head><meta content="text/html; charset=UTF-8" http-equiv="content-type"><title>gitw [repository status]</title></head><body>
<h1>Repository Status</h1>
<table style="text-align: left; width: 639px; height: 54px;" border="1" cellpadding="2" cellspacing="2">
  <tbody>
    <tr>
      <td style="vertical-align: top; font-weight: bold; width: 200px;">Name<br>
      </td>
      <td style="vertical-align: top; font-weight: bold; width: 100px;">Checkout<br>
      </td>
      <td style="vertical-align: top; font-weight: bold; width: 100px;">Build<br>
      </td>
      <td style="vertical-align: top; font-weight: bold; width: 100px;">Test<br>
      </td>
    </tr>
`
	repositories := LoadRepositories("repositories")
	for _, repository := range repositories {

		checkoutOutputFile := repository.Name + "-checkout-output.txt"
		buildOutputFile := repository.Name + "-build-output.txt"

		index += "<tr><td>" + repository.Name + "</td>"
		status := AnalyzeCheckut(repository)
		if status == false {
			index += "<td><a href=\"viewlog/" + checkoutOutputFile + "\">failed</a></td>"
		} else {
			index += "<td><a href=\"viewlog/" + buildOutputFile + "\">success</a></td>"
		}
		status = AnalyzeBuild(repository)
		if status == false {
			index += "<td><a href=\"viewlog/" + checkoutOutputFile + "\">failed</a></td>"
		} else {
			index += "<td><a href=\"viewlog/" + buildOutputFile + "\">success</a></td>"
		}
		status = AnalyzeTest(repository)
		if status == false {
			index += "<td><a href=\"viewlog/" + checkoutOutputFile + "\">failed</a></td>"
		} else {
			index += "<td><a href=\"viewlog/" + buildOutputFile + "\">success</a></td>"
		}
		index += "</tr>"
	}
	index += `</tbody></table><br><hr style="width: 100%; height: 2px;">Powered by gitw<br></body></html>`
	io.WriteString(w, index)
}

func main() {
	http.HandleFunc("/", Index)
	http.HandleFunc("/viewlog/", ViewLog)

	err := http.ListenAndServe(":12345", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
