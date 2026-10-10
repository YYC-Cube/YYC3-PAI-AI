package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"sync"
)

type Locale string

const (
	LocaleZH Locale = "zh"
	LocaleEN Locale = "en"
)

// Settings is persisted at ~/.yyc3-pai/desktop-settings.json
// (legacy ~/.octop/desktop-settings.json stays supported).
type Settings struct {
	Locale         Locale `json:"locale"`
	Autostart      bool   `json:"autostart"`
	MinimizeToTray bool   `json:"minimizeToTray"`
	PreventSleep   bool   `json:"preventSleep"`
	Port           int    `json:"port,omitempty"`
}

func defaultSettings() Settings {
	return Settings{
		Locale:         LocaleEN,
		Autostart:      false,
		MinimizeToTray: true,
		PreventSleep:   false,
		Port:           8088,
	}
}

func octopHome() string {
	if v := os.Getenv("YYC3_PAI_HOME"); v != "" {
		return v
	}
	if v := os.Getenv("OCTOP_HOME"); v != "" {
		return v
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return ".yyc3-pai"
	}
	primary := filepath.Join(home, ".yyc3-pai")
	if _, err := os.Stat(primary); err == nil {
		return primary
	}
	legacy := filepath.Join(home, ".octop")
	if _, err := os.Stat(legacy); err == nil {
		return legacy
	}
	return primary
}

func portableDir() string {
	return filepath.Join(octopHome(), "portable")
}

func settingsPath() string {
	return filepath.Join(octopHome(), "desktop-settings.json")
}

type settingsStore struct {
	mu  sync.Mutex
	cur Settings
}

func loadSettings() Settings {
	s := defaultSettings()
	data, err := os.ReadFile(settingsPath())
	if err != nil {
		return s
	}
	_ = json.Unmarshal(data, &s)
	var legacy struct {
		PreventSleepMac bool `json:"preventSleepMac"`
	}
	_ = json.Unmarshal(data, &legacy)
	if !s.PreventSleep {
		s.PreventSleep = legacy.PreventSleepMac
	}
	if s.Port == 0 {
		s.Port = 8088
	}
	if s.Locale != LocaleZH {
		s.Locale = LocaleEN
	}
	return s
}

func (st *settingsStore) get() Settings {
	st.mu.Lock()
	defer st.mu.Unlock()
	return st.cur
}

func (st *settingsStore) save(next Settings) error {
	st.mu.Lock()
	defer st.mu.Unlock()
	if next.Port == 0 {
		next.Port = 8088
	}
	if err := os.MkdirAll(octopHome(), 0o755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(next, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile(settingsPath(), data, 0o644); err != nil {
		return err
	}
	st.cur = next
	return nil
}

func greenPlat() string {
	osName := runtime.GOOS
	arch := runtime.GOARCH
	switch osName {
	case "darwin":
		osName = "darwin"
	case "windows":
		osName = "windows"
	default:
		osName = "linux"
	}
	switch arch {
	case "arm64":
		arch = "arm64"
	default:
		arch = "amd64"
	}
	return osName + "-" + arch
}
