package main

import (
    "fmt"
    "io/ioutil"
    "encoding/gob"
    "encoding/json"
    "strings"
    "strconv"
    "os"
    "time"
    "os/exec"
    "runtime"
)

type LongTestConfig struct {
    Executable     string
    FollowChuldren string
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
}

type SystemSnapshot struct {
    Name        string
    Pid         int
    CpuUsage    int
    MemoryUsage int
    OpenFiles   int
    MemoryHistory []int
}

var currentCpuUtilization int
var MemoryHistory []int
var running bool

func GetOpenFiles(pid int) int {
    pid_str := strconv.Itoa(pid)
    cmd := exec.Command("lsof", "-F", "pcn", "-p", pid_str)
    output, err := cmd.CombinedOutput()
    if err != nil {
        fmt.Printf("Error executing 'lsof': %s\n", err.Error())
        return -1
    }

    lines := strings.Split(string(output), "\n")
    /*
    for _, line := range lines {
        fmt.Printf("'%s'\n", line)
    }
    */
    return len(lines) - 2
}

func GetPidFromProcess(processName string) int {
    pidString := ""
    cmd := exec.Command("pidof", processName)
    output, err := cmd.CombinedOutput()
    if err != nil {
        fmt.Printf("Error executing 'pidof': %s\n", err.Error())
        return -1
    }
    lines := strings.Split(string(output), " ")
    if len(lines) > 1 {
        fmt.Printf("WARN - running multiple '%s' instances, selecting the first (pid %s)\n", processName, lines[0])
        pidString = lines[0]
    } else {
        pidString = string(output)
    }
    pid, err := strconv.Atoi(pidString[:len(pidString) - 1])
    if err != nil {
        fmt.Printf("Error converting pid: %s\n", err.Error())
    }
    return pid
}

func GetRSS(pid int) int {
	fileCtx, err := ioutil.ReadFile("/proc/" + strconv.Itoa(pid) + "/statm")
    if err != nil {
        fmt.Printf(":: Error reading process %d memory statistics: %s\n", pid, err.Error())
        return -1
    }
    tokens := strings.Split(string(fileCtx), " ")
    rss , _ := strconv.Atoi(tokens[1])
    return (rss * os.Getpagesize()) / 1024 // convert to KiB
}

func fetchCpuData(pid int) (int, int, int, int) {
    fileCtx, err := ioutil.ReadFile("/proc/" + strconv.Itoa(pid) + "/stat")
    if err != nil {
        fmt.Printf(":: Error reading process %d statistics: %s\n", pid, err.Error())
        return -1, -1, -1, -1
    }
    tokens := strings.Split(string(fileCtx), " ")
    utime, _ := strconv.Atoi(tokens[13])
    //stime, _ := strconv.Atoi(tokens[14])
    cutime, _ := strconv.Atoi(tokens[15])
    //cstime, _ := strconv.Atoi(tokens[16])

    fileCtx, err = ioutil.ReadFile("/proc/stat")
    if err != nil {
        fmt.Printf(":: Error reading system statistics: %s\n", pid, err.Error())
        return -1, -1, -1, -1
    }
    lines := strings.Split(string(fileCtx), "\n")
    cpu_utime := 0
    cpu_stime := 0

    for _, line := range lines {
        tokens := strings.Split(line, " ")
        if tokens[0] == "cpu" {
            // get total cpu time
            cpu_utime, err = strconv.Atoi(tokens[2])
            if err != nil {
                fmt.Printf("Error parsing integer: %s\n", err.Error())
            }

            cpu_stime, _ = strconv.Atoi(tokens[4])
            break
        }
    }
    return utime, cutime, cpu_utime, cpu_stime
}

func UpdateCpuUsage(ticker *time.Ticker, _pid int) {
    var (utime_now,
         stime_now,
         cpu_stime_now,
         cpu_utime_now,
         utime_before,
         stime_before,
         cpu_utime_before,
         cpu_stime_before int)

    for !running {
        time.Sleep(time.Second)
    }
    pid := _pid
    if utime_before == 0 {
        utime_before, stime_before, cpu_utime_before, cpu_stime_before = fetchCpuData(pid)
        <-ticker.C
    }
    for {
        utime_now, stime_now, cpu_utime_now, cpu_stime_now = fetchCpuData(pid)
        time_total_now := cpu_stime_now + cpu_utime_now
        time_total_before := cpu_stime_before + cpu_utime_before
        user_util := 100 * (utime_now - utime_before) / (time_total_now - time_total_before);
        sys_util := 100 * (stime_now - stime_before) / (time_total_now - time_total_before);

        //fmt.Printf("User utilization: %d, System utilization: %d\n", user_util, sys_util)
        utime_before, stime_before, cpu_utime_before, cpu_stime_before = utime_now, stime_now, cpu_utime_now, cpu_stime_now

        currentCpuUtilization = (user_util + sys_util) / runtime.NumCPU();
        <-ticker.C
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
	return repo
}


func GetSample(repository *Repository) *SystemSnapshot {
    sample := SystemSnapshot{}
    //sample.Pid = GetPidFromProcess(repository.LongTest.Executable)
    sample.Name = repository.Name
    sample.Pid = GetPidFromProcess(repository.LongTest.Executable)
    sample.OpenFiles = GetOpenFiles(sample.Pid)
    sample.MemoryUsage = GetRSS(sample.Pid)
    MemoryHistory = append(MemoryHistory, sample.MemoryUsage)
    sample.MemoryHistory = append(sample.MemoryHistory, MemoryHistory...)
    fmt.Println(sample.MemoryHistory)
    sample.CpuUsage = currentCpuUtilization

    return &sample
}

func WriteToFile(repository *Repository, snapshot *SystemSnapshot) {
	gob.Register(&SystemSnapshot{})

    file, err := os.Create(repository.OutputDirectory + "/" + repository.Name + "-system-output.txt")
    if err != nil {
        fmt.Printf("Error creating system output file: %s\n", err.Error())
        return
    }
    defer file.Close()

	encoder := json.NewEncoder(file)
	e := encoder.Encode(snapshot)
	if e != nil {
        fmt.Printf("LoadRepository: error decoding repository configuration from file: %s\n", e)
	}
}

func Sampler(repo *Repository) {
        for !running {
            time.Sleep(time.Second)
        }
        sample := GetSample(repo)
        fmt.Printf("--- process %s (pid %d) ---\n", "koala-nm", sample.Pid)
        fmt.Printf("Number of opened files: %d\n", sample.OpenFiles)
        fmt.Printf("Used memory (RSS): %d KiB\n", sample.MemoryUsage)
        fmt.Printf("CPU utilization: %d%%\n", sample.CpuUsage)
        WriteToFile(repo, sample)
        time.Sleep(time.Second)
}

func main() {
    // os.Args[1] - configuration path
    // os.Args[2] - repository checkout temporary path

    running = false
    if len(os.Args) < 3 {
        fmt.Printf(":: Error: too few arguments\n")
        return
    }

    fmt.Println(os.Args)
	fileCtx, err := ioutil.ReadFile(os.Args[1])
    if err != nil {
        fmt.Printf(":: Error loading configuration file '%s': %s\n", os.Args[1], err)
        return
    }

    repo := LoadRepository(string(fileCtx))


    // start collecting CPU usage
    ticker := time.NewTicker(time.Second)
    pid := GetPidFromProcess(repo.LongTest.Executable)
    if pid == -1 {
        fmt.Printf("Error: process not found\n")
        return
    }
    go UpdateCpuUsage(ticker, pid)

    go Sampler(&repo)
    // Execute the test program and wait for it's termination
    cmd := exec.Command(repo.Test, os.Args[2])
    cmd.Env = os.Environ()
    cmd.Env = append(cmd.Env, "LONGTEST=1")
    err = cmd.Start()
    if err != nil {
        fmt.Printf(":: Error executing test program '%s': %s\n", repo.Test, err.Error())
    }
    time.Sleep(2*time.Second)
    running = true
    cmd.Wait()
}
