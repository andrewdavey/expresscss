// Code butchered from Vogue http://aboutcode.net/vogue

(function () {
    var script = getScriptInfo(),
        stylesheets = getLocalStylesheets(),
        head = document.getElementsByTagName("head")[0];

    function go() {
        $(function () {
            var connection;
            function connect() {
                if (connection) return;
                connection = $.connection('_instantcss/connection');
                connection.received(function (url) {
                    reloadStylesheet(url);
                });
                connection.start();
            }
            
            connect();
        });
    }

    /**
    * Fetch all the local stylesheets from the page.
    *
    * @returns {Object} The list of local stylesheets keyed by their base URL.
    */
    function getLocalStylesheets() {

        /**
        * Checks if the stylesheet is local.
        *
        * @param {Object} link The link to check for.
        * @returns {Boolean}
        */
        function isLocalStylesheet(link) {
            var href, i, isExternal = true;
            if (link.getAttribute("rel") !== "stylesheet") {
                return false;
            }
            href = link.href;
            if (!href.match(/^https?:/)) {
                return true;
            }

            for (i = 0; i < script.bases.length; i += 1) {
                if (href.indexOf(script.bases[i]) > -1) {
                    isExternal = false;
                    break;
                }
            }

            return !(isExternal && href.match(/^https?:/));
        }

        /**
        * Checks if the stylesheet's media attribute is 'print'
        *
        * @param (Object) link The stylesheet element to check.
        * @returns (Boolean)
        */
        function isPrintStylesheet(link) {
            return link.getAttribute("media") === "print";
        }

        /**
        * Get the link's base URL.
        *
        * @param {String} href The URL to check.
        * @returns {String|Boolean} The base URL, or false if no matches found.
        */
        function getBase(href) {
            if (!href.match(/^https?:/)) { // IE 7 return relative URLs. grrr!
                if (href[0] === '/') {
                    return href;
                } else {
                    var path = document.location.pathname;
                    var index = path.lastIndexOf('/');
                    var parts = (path.substr(0, index + 1) + href).split('/');
                    var output = [];
                    for (var partIndex = 0; partIndex < parts.length; partIndex++) {
                        if (parts[partIndex] === '..') {
                            output.pop();
                        } else {
                            output.push(parts[partIndex]);
                        }
                    }
                    return output.join('/');
                }
            }

            var base, j;
            for (j = 0; j < script.bases.length; j += 1) {
                base = script.bases[j];
                if (href.indexOf(base) > -1) {
                    return href.substr(base.length);
                }
            }
            return false;
        }

        function getProperty(property) {
            return this[property];
        }

        var stylesheets = {},
          reImport = /@import\s+url\(["']?([^"'\)]+)["']?\)/g,
          links = document.getElementsByTagName("link"),
          link, href, matches, content, i, m;

        // Go through all the links in the page, looking for stylesheets.
        for (i = 0, m = links.length; i < m; i += 1) {
            link = links[i];
            if (isPrintStylesheet(link)) continue;
            if (!isLocalStylesheet(link)) continue;
            // Link is local, get the base URL.
            href = getBase(link.href);
            if (href !== false) {
                stylesheets[href] = link;
            }
        }

        // Go through all the style tags, looking for @import tags.
        links = document.getElementsByTagName("style");
        for (i = 0, m = links.length; i < m; i += 1) {
            if (isPrintStylesheet(links[i])) continue;
            content = links[i].text || links[i].textContent;
            while ((matches = reImport.exec(content))) {
                link = {
                    rel: "stylesheet",
                    href: matches[1],
                    getAttribute: getProperty
                };
                if (isLocalStylesheet(link)) {
                    // Link is local, get the base URL.
                    href = getBase(link.href);
                    if (href !== false) {
                        stylesheets[href] = link;
                    }
                }
            }
        }
        return stylesheets;
    }

    /**
    * Reload a stylesheet.
    *
    * @param {String} href The URL of the stylesheet to be reloaded.
    */
    function reloadStylesheet(href) {
        var stylesheet = stylesheets[href];
        if (!stylesheet) return;
        
        var newHref = href +
            (href.indexOf("?") >= 0 ? "&" : "?") +
            "_nocache=" +
            (new Date()).getTime();
        
        if (stylesheet.setAttribute) {
            stylesheet.setAttribute("href", newHref);
        } else {
            // Update the href to the new URL.
            stylesheet.href = newHref;
        }
    }

    /**
    * Load a script into the page, and call a callback when it is loaded.
    *
    * @param {String} src The URL of the script to be loaded.
    * @param {Function} loadedCallback The function to be called when the script is loaded.
    */
    function loadScript(srcs, loadedCallback) {
        if (srcs.length == 0) {
            loadedCallback();
            return;
        }

        var src = srcs.shift();

        var script = document.createElement("script");
        script.setAttribute("type", "text/javascript");
        script.setAttribute("src", src);

        // Call the callback when the script is loaded.
        function done() {
            loadScript(srcs, loadedCallback);
        }
        script.onload = done;
        script.onreadystatechange = function () {
            if (this.readyState === "complete" || this.readyState === "loaded") {
                done();
            }
        };

        head.appendChild(script);
    }

    /**
    * Load scripts into the page, and call a callback when they are loaded.
    *
    * @param {Array} scripts The scripts to be loaded.
    * @param {Function} loadedCallback The function to be called when all the scripts have loaded.
    */
    function loadScripts(scripts, loadedCallback) {
        var srcs = [], property, ids, object, i, j;

        for (i = 0; i < scripts.length; i++) {
            property = scripts[i][0];
            ids = property.split('.');
            object = window;
            for (j = 0; j < ids.length; j++) {
                if (ids[j] in object) {
                    object = object[ids[j]];
                } else {
                    object = null;
                    break;
                }
            }
            if (!object) {
                srcs.push(scripts[i][1]);
            }
        }

        if (srcs.length == 0) {
            loadedCallback();
        }
        loadScript(srcs, loadedCallback);
    }

    /**
    * Fetches the info for the vogue client.
    */
    function getScriptInfo() {
        var bases = [document.location.protocol + "//" + document.location.host],
            scripts, src, rootUrl;

        scripts = document.getElementsByTagName("script");
        // The last parsed script will be our script.
        src = scripts[scripts.length - 1].getAttribute("src");
        rootUrl = src.match(/^.*\/_instantcss\/assets\//)[0];

        return {
            rootUrl: rootUrl,
            bases: bases
        };
    }

    loadScripts(
        [
            ['JSON', script.rootUrl + "json2"],
            ['jQuery', script.rootUrl + "jquery"],
            ['$.signalR', script.rootUrl + "signalr"]
        ],
        go
    );
} ());