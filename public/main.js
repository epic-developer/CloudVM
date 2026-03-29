function createLaunchUrl() {
  return new URL("/launch.html", window.location.origin);
}

function launch(vm) {
  var ram = Number(document.getElementById('ram').value);
  var vram = Number(document.getElementById('vram').value);
  if (ram < 256) {
    alert('The minimum amount of RAM is limited to 256');
  }
  else if (ram > 4095) {
    alert('The maximum amount of RAM is limited to 4095 MB (just under the limit of 4 GB which is enforced by the browser)');
  }
  if (vram < 8) {
    alert('The minimum amount of VRAM is limited to 8');
  }
  else if (vram > 128) {
    alert('The maximum amount of VRAM is limited to 128 MB (exceeding that limit can cause buggy and/or blank displays). 128 MB of display memory is the threshold at which the emulator display will become more slow.');
  }
  var acpiEnabled = document.getElementById('acpiEnabled').checked;
  var asyncEnabled = document.getElementById('asyncEnabled').checked;
  var networkRelay = document.getElementById('relay').value;
  if (networkRelay == '') {
    networkRelay = 'none';
  }
  if (vm == "Custom VM") {
    var cd = document.getElementById('cd').value;
    var floppy = document.getElementById('floppy').value;
    var hd = document.getElementById('hd').value;
    if (document.getElementById("cd_image").files[0]) {
        cd = URL.createObjectURL(document.getElementById("cd_image").files[0]);
    }
    if (document.getElementById("floppy_image").files[0]) {
        floppy = URL.createObjectURL(document.getElementById("floppy_image").files[0]);
    }
    if (document.getElementById("hda_image").files[0]) {
        hd = URL.createObjectURL(document.getElementById("hda_image").files[0]);
    }
    if (cd == '') {
      cd = 'none';
    }
    if (floppy == '') {
      floppy = 'none';
    }
    if (hd == '') {
      hd = 'none';
    }
    if (cd == 'none' && floppy == 'none' && hd == 'none') {
      alert('Please configure the custom VM options by specifying at least one of the following: CDROM, Floppy Disk, HDA in the input fields below.');
      return;
    }
    const launchUrl = createLaunchUrl();
    launchUrl.searchParams.set('type', 'Custom');
    launchUrl.searchParams.set('ram', String(ram));
    launchUrl.searchParams.set('vram', String(vram));
    launchUrl.searchParams.set('cd', String(cd));
    launchUrl.searchParams.set('floppy', String(floppy));
    launchUrl.searchParams.set('hd', String(hd));
    launchUrl.searchParams.set('acpi', String(acpiEnabled));
    launchUrl.searchParams.set('async', String(asyncEnabled));
    launchUrl.searchParams.set('relay', String(networkRelay));
    window.open(launchUrl.toString(), '_blank');
  }
  else {
    const launchUrl = createLaunchUrl();
    launchUrl.searchParams.set('type', vm);
    launchUrl.searchParams.set('ram', String(ram));
    launchUrl.searchParams.set('vram', String(vram));
    launchUrl.searchParams.set('acpi', String(acpiEnabled));
    launchUrl.searchParams.set('async', String(asyncEnabled));
    launchUrl.searchParams.set('relay', String(networkRelay));
    window.location.assign(launchUrl.toString());
  }
}

let VMs;

var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
       VMs = JSON.parse(xhttp.responseText);
       if (window.rewriteVmCatalog) {
         VMs = window.rewriteVmCatalog(VMs);
       }
    }
};
xhttp.open("GET", "VMs.json", true);
xhttp.send();

function displayDetails(vm) {
  document.getElementById('vmDetails').innerHTML = VMs[vm]["Description"];
}

function removeDetails() {
  document.getElementById('vmDetails').innerHTML = 'Hover over another operating system to see more info';
}
