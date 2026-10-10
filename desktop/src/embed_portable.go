//go:build !production || darwin

package main

// Development builds look for YYC3-Pai-<plat>.zip or
// YYC3-Pai-portable-<plat>-*.zip beside the executable (legacy Octop-<plat>.zip
// and Octop-portable-<plat>-*.zip remain supported as fallbacks). macOS
// production copies the zip into Resources as YYC3-Pai-<plat>.zip.
var embeddedPortable []byte
