ESM = """
const CDN_URL = "https://cdn.jsdelivr.net/npm/@metapages/metapage@1.10.8/+esm";

let _renderMetapage = null;

async function loadRenderMetapage() {
    if (!_renderMetapage) {
        const mod = await import(CDN_URL);
        _renderMetapage = mod.renderMetapage;
    }
    return _renderMetapage;
}

export default {
    async render({ model, el }) {
        // Lay out el as a column: the metapage fills the space, an optional
        // "saved URL" footer sits beneath it (only when there is one to show).
        el.style.display = "flex";
        el.style.flexDirection = "column";
        el.style.boxSizing = "border-box";
        el.style.width = model.get("width") || "100%";
        el.style.height = model.get("height") || "400px";

        // Inject CSS to remove iframe borders and inline gaps
        const style = document.createElement("style");
        style.textContent = ".metaframe-widget-container { box-sizing: border-box; flex: 1 1 auto; min-height: 0; width: 100%; } .metaframe-widget-container * { box-sizing: border-box; } .metaframe-widget-container > div { height: 100%; } .metaframe-widget-container iframe { border: none; display: block; margin: 0; padding: 0; box-sizing: border-box; width: 100%; height: 100%; }";
        el.appendChild(style);

        const container = document.createElement("div");
        container.className = "metaframe-widget-container";
        el.appendChild(container);

        // Footer showing the latest short URL produced by editing + saving.
        const footer = document.createElement("div");
        footer.style.cssText = "flex: 0 0 auto; display: none; align-items: center; gap: 6px; padding: 4px 6px; font-family: sans-serif; font-size: 12px; color: #555; background: #f7f7f7; border-top: 1px solid #e0e0e0; overflow: hidden;";
        const footerLabel = document.createElement("span");
        footerLabel.textContent = "Saved:";
        footerLabel.style.flex = "0 0 auto";
        const footerLink = document.createElement("a");
        footerLink.target = "_blank";
        footerLink.rel = "noopener noreferrer";
        footerLink.style.cssText = "flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
        const footerCopy = document.createElement("button");
        footerCopy.textContent = "copy";
        footerCopy.style.cssText = "flex: 0 0 auto; cursor: pointer; font-size: 11px; padding: 1px 6px;";
        footer.appendChild(footerLabel);
        footer.appendChild(footerLink);
        footer.appendChild(footerCopy);
        el.appendChild(footer);

        function renderSavedUrl() {
            const savedUrl = model.get("saved_url") || "";
            if (savedUrl) {
                footerLink.textContent = savedUrl;
                footerLink.href = savedUrl;
                footer.style.display = "flex";
            } else {
                footer.style.display = "none";
            }
        }
        footerCopy.addEventListener("click", () => {
            const savedUrl = model.get("saved_url") || "";
            if (savedUrl && navigator.clipboard) {
                navigator.clipboard.writeText(savedUrl);
            }
        });
        renderSavedUrl();

        const renderMetapage = await loadRenderMetapage();

        let currentResult = null;

        function applyAllowToIframes() {
            const allow = model.get("allow") || "";
            if (allow) {
                container.querySelectorAll("iframe").forEach(iframe => {
                    iframe.allow = allow;
                });
            }
        }

        async function createMetapage() {
            if (currentResult) {
                currentResult.dispose();
                currentResult = null;
            }
            container.innerHTML = "";

            const url = model.get("url");
            if (!url) return;

            const definition = {
                version: "0.3",
                metaframes: {
                    mf: { url },
                },
            };

            const result = await renderMetapage({
                definition,
                rootDiv: container,
                onOutputs: (outputs) => {
                    const mfOutputs = outputs.mf || {};
                    model.set("outputs", JSON.parse(JSON.stringify(mfOutputs)));
                    model.save_changes();
                },
            });
            currentResult = result;

            applyAllowToIframes();

            // Push current inputs if any
            const inputs = model.get("inputs");
            if (inputs && Object.keys(inputs).length > 0) {
                result.setInputs({ mf: inputs });
            }
        }

        // The embedded editor (same-origin to the URL-shortening worker) mints a
        // short URL when the user clicks "Save and Shorten URL", then postMessages
        // it here. We record it in `saved_url` WITHOUT touching `url`, so the live
        // iframe the user is editing is never torn down and reloaded.
        function expectedOrigin() {
            try {
                return new URL(model.get("url") || "").origin;
            } catch {
                return null;
            }
        }
        const onMessage = (event) => {
            const data = event.data;
            if (!data || data.type !== "metaframe-widget:shorturl" || !data.url) {
                return;
            }
            // Route to the correct widget (one notebook may hold several) and
            // verify the message came from our metaframe's origin.
            const iframe = container.querySelector("iframe");
            if (!iframe || event.source !== iframe.contentWindow) return;
            const origin = expectedOrigin();
            if (origin && event.origin !== origin) return;

            model.set("saved_url", data.url);
            model.save_changes();
        };
        window.addEventListener("message", onMessage);

        model.on("change:url", createMetapage);
        model.on("change:saved_url", renderSavedUrl);

        model.on("change:inputs", () => {
            if (currentResult) {
                const inputs = model.get("inputs");
                currentResult.setInputs({ mf: inputs });
            }
        });

        model.on("change:width", () => {
            el.style.width = model.get("width") || "100%";
        });

        model.on("change:height", () => {
            el.style.height = model.get("height") || "400px";
        });

        model.on("change:allow", applyAllowToIframes);

        await createMetapage();

        return () => {
            window.removeEventListener("message", onMessage);
            if (currentResult) {
                currentResult.dispose();
            }
        };
    },
};
"""
