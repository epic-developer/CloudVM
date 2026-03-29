(function() {
    const legacyHosts = new Set([
        "webvm.replit.app",
        "webvm.repl.app"
    ]);

    if(!legacyHosts.has(window.location.hostname)) {
        return;
    }

    const destination = new URL(window.location.href);
    destination.protocol = "https:";
    destination.hostname = "www.cloudvm.app";
    destination.port = "";

    if(destination.href !== window.location.href) {
        window.location.replace(destination.toString());
    }
})();
