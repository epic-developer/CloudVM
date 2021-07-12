"use strict";

let type;
let emulator;
let vmSettings;

let VMs;

function $(id) {
    return document.getElementById(id);
}

window.onload = function() {
    const script = document.createElement("script");
    script.src = "build/xterm.js";
    script.async = true;
    document.body.appendChild(script);
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            VMs = JSON.parse(xhttp.responseText);
            var initURL = new URL(window.location.href);
            type = initURL.searchParams.get('type');
            var ram = Number(initURL.searchParams.get('ram'));
            var vram = Number(initURL.searchParams.get('vram'));
            var acpiEnabled = eval(initURL.searchParams.get('acpi'));
            var asyncEnabled = eval(initURL.searchParams.get('async'));
            var networkRelay = initURL.searchParams.get('relay');
            if (networkRelay == 'none') {
                networkRelay = '';
            }
            document.title = type + ' - CloudVM';
            var cdURL;
            if (type == "Custom") {
                var vmConfig = {
                    wasm_path: "/build/v86.wasm",
                    memory_size: ram * 1024 * 1024, //megabytes to bytes
                    vga_memory_size: vram * 1024 * 1024, //megabytes to bytes
                    screen_container: $("osGUI"),
                    serial_container_xtermjs: $("terminal"),
                    acpi: acpiEnabled,
                    bios: {
                        url: "/bios/seabios.bin",
                    },
                    vga_bios: {
                        url: "/bios/vgabios.bin",
                    },
                    autostart: false,
                    network_relay_url: networkRelay,
                }
                if (initURL.searchParams.get('cd') != 'none') {
                    vmConfig.cdrom = {
                        url: initURL.searchParams.get('cd'),
                        async: asyncEnabled,
                    };
                }
                if (initURL.searchParams.get('floppy') != 'none') {
                    vmConfig.fda = {
                        url: initURL.searchParams.get('floppy'),
                        async: asyncEnabled,
                    };
                }
                if (initURL.searchParams.get('hd') != 'none') {
                    vmConfig.hda = {
                        url: initURL.searchParams.get('hd'),
                        async: asyncEnabled,
                    };
                }
            }
            else {
                var startState = false;
                if (ram >= 512 && vram >= 8) {
                    startState = true; //Start states are created with 512 mb of ram and 8 mb of vram. anything higher is fine. anything lower will crash if trying to load startState with more RAM than available.
                }
                else {
                    alert('Please use at least 512 MB of RAM and 8 MB of VRAM. If you use a lower amount, you may experience significantly longer load times.')
                }

                if (VMs[type] == null) {
                    alert(type + ' is not a valid VM. Press OK to return to the launcher.');
                    window.open('https://vm.davidfahim.repl.co/', '_top');
                }

                const vm = VMs[type];

                var vmConfig = {
                    wasm_path: "/build/v86.wasm",
                    memory_size: ram * 1024 * 1024, //megabytes to bytes
                    vga_memory_size: vram * 1024 * 1024, //megabytes to bytes
                    screen_container: $("osGUI"),
                    serial_container_xtermjs: $("terminal"),
                    bios: {
                        url: "/bios/seabios.bin",
                    },
                    vga_bios: {
                        url: "/bios/vgabios.bin",
                    },
                    autostart: false,
                    network_relay_url: networkRelay,
                }

                if (vm.cmdline != null) {
                    vmConfig.cmdline = vm.cmdline.join(" ");
                    if (vmConfig.cmdline.includes("cpc" || "if" || "ip")) {
                        alert('Follow the "Recommended commands after booting" section which may contain commands that you need to run in order to gain internet access.');
                    }
                    document.getElementById('cmdline2').innerHTML = "Recommended commands after booting:";
                    document.getElementById('cmdline').innerHTML = vm.cmdline.join("<br>");
                }

                if (vm.initial_state != null) {
                    vmConfig.initial_state = vm.initial_state;
                }

                let diskType;

                if (vm.hda != null) {
                    diskType = 'hda';
                }
                else if (vm.cdrom != null) {
                    diskType = 'cdrom';
                }
                else if (vm.bzimage != null) {
                    diskType = 'bzimage';
                }
                else if (vm.fda != null) {
                    diskType = 'fda';
                }

                if (vm.filesystem != null) {
                    vmConfig.filesystem = {};
                    if (vm.filesystem.baseurl != null) {
                        vmConfig.filesystem = {
                            baseurl: vm.filesystem.baseurl
                        };
                    }
                }

                if (vm.acpi != null) {
                    vmConfig.acpi = vm.acpi;
                }
                else {
                    vmConfig.acpi = acpiEnabled;
                }

                /*if (vm.vram != null) {
                    vmConfig.vga_memory_size = vm.vram * 1024 * 1024;
                }*/

                if (vm.preserve_mac_from_state_image != null) {
                    vmConfig.preserve_mac_from_state_image = vm.preserve_mac_from_state_image;
                }
                if (diskType != undefined) {
                    let asyncEnable;
                    if (eval('vm.' + diskType + '.async') != null) {
                        asyncEnable = eval('vm.' + diskType + '.async');
                    }
                    else {
                        asyncEnable = asyncEnabled;
                    }
                    vmConfig[diskType] = {
                        url: eval('vm.' + diskType + '.url'),
                        size: eval('vm.' + diskType + '.size'),
                        async: asyncEnable
                    };
                }

                /*
                if (vmConfig.filesystem != null && vmConfig.filesystem.baseurl != null){
                    storeURL = vmConfig.filesystem.baseurl;
                }
                else{
                    storeURL = vmConfig[diskType].url;
                }
                */

                if (vmConfig.initial_state != null) {
                    let storeURL = vmConfig.initial_state.url;
                    if (vm.ram != ram) {
                        if (storeURL.includes('.zst') || ram < vm.ram) {
                            if (confirm("Your RAM is not set to the recommended amount of " + String(vm.ram) + " MB. Do you want to automatically set the RAM to " + String(vm.ram) + " MB?")) {
                                vmConfig.memory_size = vm.ram * 1024 * 1024;
                            }
                            else {
                                if (storeURL.includes('.zst')) {
                                    vmConfig.initial_state.url = storeURL.replace('.zst', '');
                                }
                                else {
                                    vmConfig.initial_state.url = "";
                                }
                            }
                        }
                    }
                }

                document.getElementById('vmDescription').innerHTML = vm["Description"];

                if (vm.msg != null) {
                    alert(vm.msg);
                }
            }

            try {
                emulator = new V86Starter(vmConfig);
            }
            catch (error) {
                alert('Oh no! An error occured. Please try again later.')
                console.log(error);
            }

            emulator.add_listener("emulator-loaded", function() {
                vmSettings = vmConfig;
                add_image_download_button(vmSettings.hda, "hda");
                add_image_download_button(vmSettings.hdb, "hdb");
                add_image_download_button(vmSettings.fda, "fda");
                add_image_download_button(vmSettings.fdb, "fdb");
                add_image_download_button(vmSettings.cdrom, "cdrom");
                $('vmStartBTN').style.display = 'inline';
                $('osGUI').style.display = 'none';
                $('loader').remove();
                $("loading").style.display = "none";
            });

            emulator.add_listener("download-progress", function(e) {
                show_progress(e);
            });

            emulator.add_listener("download-error", function(e) {
                var el = $("loading");
                el.style.display = "block";
                el.textContent = "Loading " + e.file_name + " failed. Check your connection and reload the page to try again.";
            });

            if (vmConfig['filesystem'] != null) {
                init_filesystem_panel(emulator);
            }

            $("save_file").onclick = function() {
                emulator.save_state(function(error, result) {
                    if (error) {
                        console.log(error.stack);
                        console.log("Couldn't save state: ", error);
                    }
                    else {
                        dump_file(result, type + " CloudVM Save.bin");
                    }
                });
                $("save_state").blur();
            };
            $("restore_file").onchange = function() {
                var file = this.files[0];
                if (!file) {
                    return;
                }
                var was_running = emulator.is_running();
                if (was_running) {
                    emulator.stop();
                }
                var filereader = new FileReader();
                filereader.onload = function(e) {
                    try {
                        emulator.restore_state(e.target.result);
                    }
                    catch (err) {
                        alert("Something bad happened while restoring the state:\n" + err + "\n\n" +
                            "Note that the current configuration must be the same as the original");
                        throw err;
                    }

                    if (was_running) {
                        emulator.run();
                    }
                };
                filereader.readAsArrayBuffer(file);
                this.value = "";
            };
            $('osGUI').addEventListener('click', function() {
                if (os_uses_mouse) {
                    $('osGUI').requestPointerLock();
                }
                else {
                    if (window.getSelection().isCollapsed) {
                        let phone_keyboard = document.getElementsByClassName("phone_keyboard")[0];
                        // stop mobile browser from scrolling into view when the keyboard is shown
                        phone_keyboard.style.top = document.body.scrollTop + 100 + "px";
                        phone_keyboard.style.left = document.body.scrollLeft + 100 + "px";
                        phone_keyboard.focus();
                    }
                }
            });
            window.addEventListener("keydown", ctrl_w_rescue, false);
            window.addEventListener("keyup", ctrl_w_rescue, false);
            window.addEventListener("blur", ctrl_w_rescue, false);
            const phone_keyboard = document.getElementsByClassName("phone_keyboard")[0];
            phone_keyboard.setAttribute("autocorrect", "off");
            phone_keyboard.setAttribute("autocapitalize", "off");
            phone_keyboard.setAttribute("spellcheck", "false");
            phone_keyboard.tabIndex = 0;
            $("osGUI").addEventListener("mousedown", (e) => {
                e.preventDefault();
                phone_keyboard.focus();
            }, false);
            $("take_screenshot").onclick = function() {
                emulator.screen_make_screenshot();

                $("take_screenshot").blur();
            };
            $("ctrlaltdel").onclick = function() {
                emulator.keyboard_send_scancodes([
                    0x1D, // ctrl
                    0x38, // alt
                    0x53, // delete

                    // break codes
                    0x1D | 0x80,
                    0x38 | 0x80,
                    0x53 | 0x80,
                ]);

                $("ctrlaltdel").blur();
            };
            $("alttab").onclick = function() {
                emulator.keyboard_send_scancodes([
                    0x38, // alt
                    0x0F, // tab
                ]);

                setTimeout(function() {
                    emulator.keyboard_send_scancodes([
                        0x38 | 0x80,
                        0x0F | 0x80,
                    ]);
                }, 100);

                $("alttab").blur();
            };
            $("scale").onchange = function() {
                var n = parseFloat(this.value);
                if (n || n > 0) {
                    if ($('osDisplay').style.display == 'block') {
                        emulator.screen_set_scale(n, n);
                    }
                    else {
                        $("scale").value = 1.0;
                        alert('You can only change display scale in VGA Graphical (not Text) mode.');
                    }
                }
            };

            var last_tick = 0;
            var running_time = 0;
            var last_instr_counter = 0;
            var interval = null;
            var os_uses_mouse = false;
            var total_instructions = 0;

            function update_info() {
                var now = Date.now();

                var instruction_counter = emulator.get_instruction_counter();

                if (instruction_counter < last_instr_counter) {
                    // 32-bit wrap-around
                    last_instr_counter -= 0x100000000;
                }

                var last_ips = instruction_counter - last_instr_counter;
                last_instr_counter = instruction_counter;
                total_instructions += last_ips;

                var delta_time = now - last_tick;
                running_time += delta_time;
                last_tick = now;

                $("speed").textContent = (last_ips / 1000 / delta_time).toFixed(1);
                $("avg_speed").textContent = (total_instructions / 1000 / running_time).toFixed(1);
                $("running_time").textContent = format_timestamp(running_time / 1000 | 0);
            }

            emulator.add_listener("emulator-started", function() {
                last_tick = Date.now();
                interval = setInterval(update_info, 1000);
            });

            emulator.add_listener("emulator-stopped", function() {
                update_info();
                if (interval !== null) {
                    clearInterval(interval);
                }
            });

            var stats_9p = {
                read: 0,
                write: 0,
                files: [],
            };

            emulator.add_listener("9p-read-start", function(args) {
                const file = args[0];
                stats_9p.files.push(file);
                $("info_filesystem").style.display = "block";
                $("info_filesystem_status").textContent = "Loading ...";
                $("info_filesystem_last_file").textContent = file;
            });
            emulator.add_listener("9p-read-end", function(args) {
                stats_9p.read += args[1];
                $("info_filesystem_bytes_read").textContent = stats_9p.read;

                const file = args[0];
                stats_9p.files = stats_9p.files.filter(f => f !== file);

                if (stats_9p.files[0]) {
                    $("info_filesystem_last_file").textContent = stats_9p.files[0];
                }
                else {
                    $("info_filesystem_status").textContent = "Idle";
                }
            });
            emulator.add_listener("9p-write-end", function(args) {
                stats_9p.write += args[1];
                $("info_filesystem_bytes_written").textContent = stats_9p.write;

                if (!stats_9p.files[0]) {
                    $("info_filesystem_last_file").textContent = args[0];
                }
            });

            var stats_storage = {
                read: 0,
                read_sectors: 0,
                write: 0,
                write_sectors: 0,
            };

            emulator.add_listener("ide-read-start", function() {
                $("info_storage").style.display = "block";
                $("info_storage_status").textContent = "Loading ...";
            });
            emulator.add_listener("ide-read-end", function(args) {
                stats_storage.read += args[1];
                stats_storage.read_sectors += args[2];

                $("info_storage_status").textContent = "Idle";
                $("info_storage_bytes_read").textContent = stats_storage.read;
                $("info_storage_sectors_read").textContent = stats_storage.read_sectors;
            });
            emulator.add_listener("ide-write-end", function(args) {
                stats_storage.write += args[1];
                stats_storage.write_sectors += args[2];

                $("info_storage_bytes_written").textContent = stats_storage.write;
                $("info_storage_sectors_written").textContent = stats_storage.write_sectors;
            });

            var stats_net = {
                bytes_transmitted: 0,
                bytes_received: 0,
            };

            emulator.add_listener("eth-receive-end", function(args) {
                stats_net.bytes_received += args[0];

                $("info_network").style.display = "block";
                $("info_network_bytes_received").textContent = stats_net.bytes_received;
            });
            emulator.add_listener("eth-transmit-end", function(args) {
                stats_net.bytes_transmitted += args[0];

                $("info_network").style.display = "block";
                $("info_network_bytes_transmitted").textContent = stats_net.bytes_transmitted;
            });


            emulator.add_listener("mouse-enable", function(is_enabled) {
                os_uses_mouse = is_enabled;
                $("info_mouse_enabled").textContent = is_enabled ? "Yes" : "No";
            });

            emulator.add_listener("screen-set-mode", function(is_graphical) {
                if (is_graphical) {
                    $("info_vga_mode").textContent = "Graphical";
                }
                else {
                    $("info_vga_mode").textContent = "Text";
                    $("info_res").textContent = "-";
                    $("info_bpp").textContent = "-";
                }
            });
            emulator.add_listener("screen-set-size-graphical", function(args) {
                $("info_res").textContent = args[0] + "x" + args[1];
                $("info_bpp").textContent = args[4];
            });
        };
    }
    xhttp.open("GET", "VMs.json", true);
    xhttp.send();
}

function add_image_download_button(obj, diskType) {
    var elem = $("get_" + diskType + "_image");
    elem.style.display = "inline";
    if (!obj || obj.size > 100 * 1024 * 1024) {
        elem.style.display = "none";
        return;
    }
    elem.onclick = function(e) {
        let buffer = emulator.disk_images[diskType];
        let filename = type + (diskType === "cdrom" ? ".iso" : ".img");
        if (buffer.get_as_file) {
            var file = buffer.get_as_file(filename);
            download(file, filename);
        }
        else {
            buffer.get_buffer(function(b) {
                if (b) {
                    dump_file(b, filename);
                }
                else {
                    alert("The file could not be loaded. Maybe it's too big (100 MB limit)?");
                }
            });
        }
        elem.blur();
    };
}

function memDump() {
    var mem8 = emulator.v86.cpu.mem8;
    dump_file(new Uint8Array(mem8.buffer, mem8.byteOffset, mem8.length), type + " memoryDump.bin");
}

var emulatorPaused = false;

function togglePause() {
    if (emulatorPaused) {
        emulator.run();
        emulatorPaused = false;
        $('emulatorPause').innerHTML = 'Pause Emulator';
    }
    else {
        emulator.stop();
        emulatorPaused = true;
        $('emulatorPause').innerHTML = 'Resume Emulator';
    }
}

function startVM() {
    if (type === "DSL") {
        setTimeout(() => {
            // hack: Start automatically
            emulator.keyboard_send_text("\n");
        }, 3000);
    }
    else if (type == "Android" || type == "LineageOS") {
        setTimeout(() => {
            // hack: select vesa mode and start automatically
            emulator.keyboard_send_scancodes([0xe050, 0xe050 | 0x80]);
            emulator.keyboard_send_text("\n");
        }, 3000);
    }
    $('vmStartBTN').style.display = 'none';
    $('osGUI').style.display = 'block';
    emulator.run();
}

function format_timestamp(time) {
    if (time < 60) {
        return time + "s";
    }
    else if (time < 3600) {
        return (time / 60 | 0) + "m " + v86util.pad0(time % 60, 2) + "s";
    }
    else {
        return (time / 3600 | 0) + "h " +
            v86util.pad0((time / 60 | 0) % 60, 2) + "m " +
            v86util.pad0(time % 60, 2) + "s";
    }
}

function fullscreen() {
    $('osGUI').requestFullscreen();
    $('osGUI').requestPointerLock();
}

function changeScale(size) {
    if ($('osDisplay').style.display == 'block') {
        var newWidth = size * 100;
        var newHeight = size * 75;
        $('osDisplay').setAttribute('width', newWidth);
        $('osDisplay').setAttribute('height', newHeight);
        $('osDisplay').setAttribute('style', "display: block; image-rendering: pixelated; width: " + (newWidth * 2 / 3) + "px; height: " + (newHeight * 2 / 3) + "px");
    }
    else {
        $('osTerminal').style = "white-space: pre; font: " + size + "px monospace; line-height: " + size + "px";
    }
}

function init_filesystem_panel(emulator) {
    $("filesystem_panel").style.display = "block";
    $("filesystem_send_file").onchange = function() {
        Array.prototype.forEach.call(this.files, function(file) {
            var loader = new v86util.SyncFileBuffer(file);
            loader.onload = function() {
                loader.get_buffer(function(buffer) {
                    emulator.create_file("/" + file.name, new Uint8Array(buffer));
                });
            };
            loader.load();
        }, this);
        this.value = "";
        this.blur();
    };
    $("filesystem_get_file").onkeypress = function(e) {
        if (e.which !== 13) {
            return;
        }
        this.disabled = true;
        emulator.read_file(this.value, function(err, uint8array) {
            this.disabled = false;
            if (uint8array) {
                var filename = this.value.replace(/\/$/, "").split("/");
                filename = filename[filename.length - 1] || "root";
                dump_file(uint8array, filename);
                this.value = "";
            }
            else {
                alert("Can't read file");
            }
        }.bind(this));
    };
}

function chr_repeat(chr, count) {
    var result = "";

    while (count-- > 0) {
        result += chr;
    }

    return result;
}

var progress_ticks = 0;

function show_progress(e) {
    var el = $("loading");
    el.style.display = "block";
    if (e.file_name.endsWith(".wasm")) {
        const parts = e.file_name.split("/");
        el.textContent = "Fetching " + parts[parts.length - 1] + " ...";
        return;
    }
    if (e.file_index === e.file_count - 1 && e.loaded >= e.total - 2048) {
        el.textContent = "Done downloading. Enabling start option...";
        return;
    }
    var line = "Downloading images ";
    if (typeof e.file_index === "number" && e.file_count) {
        line += "[" + (e.file_index + 1) + "/" + e.file_count + "] ";
    }
    if (e.total && typeof e.loaded === "number") {
        var per100 = Math.floor(e.loaded / e.total * 100);
        per100 = Math.min(100, Math.max(0, per100));
        var per50 = Math.floor(per100 / 2);
        line += per100 + "% [";
        line += chr_repeat("#", per50);
        line += chr_repeat(" ", 50 - per50) + "]";
    }
    else {
        line += chr_repeat(".", progress_ticks++ % 50);
    }
    el.textContent = line;
}

function ctrl_w_rescue(e) {
    if (e.ctrlKey) {
        window.onbeforeunload = function() {
            window.onbeforeunload = null;
            return "CTRL-W cannot be sent to the emulator.";
        };
    }
    else {
        window.onbeforeunload = null;
    }
}