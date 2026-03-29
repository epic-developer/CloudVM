(function() {
    const LEGACY_VM_ASSET_ROOT = "https://storage.googleapis.com/vm-general-storage/";
    const VM_ASSET_KEYS = [
        "hda",
        "hdb",
        "fda",
        "fdb",
        "cdrom",
        "initial_state",
        "bzimage",
        "initrd",
        "multiboot"
    ];

    const runtimeConfig = window.CLOUDVM_RUNTIME_CONFIG || {};
    const assetBaseUrl = normalizeBaseUrl(runtimeConfig.vmAssetBaseUrl || "");

    function normalizeBaseUrl(baseUrl) {
        if(typeof baseUrl !== "string" || baseUrl === "") {
            return "";
        }

        return baseUrl.replace(/\/+$/, "");
    }

    function joinAssetUrl(baseUrl, assetPath) {
        const url = new URL(baseUrl + "/");
        const basePath = url.pathname.replace(/\/+$/, "");

        url.pathname = `${basePath}/${assetPath}`.replace(/\/+/g, "/");

        return url.toString();
    }

    function getLegacyAssetPath(url) {
        if(typeof url !== "string" || !url.startsWith(LEGACY_VM_ASSET_ROOT)) {
            return "";
        }

        return url.slice(LEGACY_VM_ASSET_ROOT.length).replace(/^\/+/, "");
    }

    function resolveVmAssetUrl(url) {
        if(assetBaseUrl === "") {
            return url;
        }

        const assetPath = getLegacyAssetPath(url);

        if(assetPath === "") {
            return url;
        }

        return joinAssetUrl(assetBaseUrl, assetPath);
    }

    function rewriteVmCatalog(catalog) {
        if(!catalog || typeof catalog !== "object") {
            return catalog;
        }

        Object.values(catalog).forEach(vm => {
            if(!vm || typeof vm !== "object") {
                return;
            }

            VM_ASSET_KEYS.forEach(key => {
                if(vm[key] && typeof vm[key].url === "string") {
                    vm[key].url = resolveVmAssetUrl(vm[key].url);
                }
            });
        });

        return catalog;
    }

    window.CLOUDVM_ASSET_BASE_URL = assetBaseUrl;
    window.resolveVmAssetUrl = resolveVmAssetUrl;
    window.rewriteVmCatalog = rewriteVmCatalog;
})();
