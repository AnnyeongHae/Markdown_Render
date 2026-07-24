/* MD Viewer & Converter — pure core logic (no DOM).
   Shared by index.html (browser) and tests/regression.js (Node).
   Keeping this logic here makes it unit-testable and keeps index.html lean. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.MDCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function nfc(s) { try { return String(s).normalize("NFC"); } catch (e) { return String(s); } }

  function normPath(p) {
    return String(p).replace(/\\/g, "/").replace(/^\.?\//, "").replace(/^\/+/, "")
      .split("/").reduce(function (a, s) {
        if (s === "..") a.pop(); else if (s !== "." && s !== "") a.push(s);
        return a;
      }, []).join("/");
  }

  function pathKey(p) { return nfc(normPath(p)).toLowerCase(); }

  // filename matching key: decode → basename → NFC → strip zero-width → trim → lowercase
  function keyOf(name) {
    var s = String(name);
    try { s = decodeURIComponent(s); } catch (e) {}
    s = s.replace(/\\/g, "/").split(/[?#]/)[0];
    s = s.split("/").pop() || "";
    s = nfc(s).replace(/[​-‍﻿]/g, "").trim().toLowerCase();
    return s;
  }

  function extSwap(base) {
    if (/\.jpg$/.test(base)) return base.replace(/\.jpg$/, ".jpeg");
    if (/\.jpeg$/.test(base)) return base.replace(/\.jpeg$/, ".jpg");
    return null;
  }

  // maps = { assets:Map(pathKey->url), byBase:Map(keyOf->url), overrides:Map(keyOf->url) }
  function resolveImageSrc(src, docDir, maps) {
    if (/^(https?:|data:)/i.test(src)) return src;
    var raw = String(src).trim().replace(/^file:\/{0,}/i, "");
    try { raw = decodeURIComponent(raw.split(/[?#]/)[0]); } catch (e) { raw = raw.split(/[?#]/)[0]; }
    raw = raw.replace(/\\/g, "/");
    var base = keyOf(raw);
    if (maps.overrides && maps.overrides.has(base)) return maps.overrides.get(base);
    var cands = [];
    if (docDir) cands.push(pathKey(docDir + "/" + raw));
    cands.push(pathKey(raw));
    for (var i = 0; i < cands.length; i++) if (maps.assets.has(cands[i])) return maps.assets.get(cands[i]);
    if (maps.byBase.has(base)) return maps.byBase.get(base);
    var sw = extSwap(base);
    if (sw && maps.byBase.has(sw)) return maps.byBase.get(sw);
    return null;
  }

  function preprocessObsidian(text, name) {
    if (!text) return "";
    var s = String(text);
    var trimmed = s.trim();

    // 1. Standalone .mmd or .mermaid file wrapper
    if (name && /\.(mmd|mermaid)$/i.test(name)) {
      if (!/^\s*```/i.test(trimmed)) {
        s = "```mermaid\n" + trimmed + "\n```";
      }
    } else {
      // 2. Smart wrap unfenced Mermaid diagram blocks anywhere in the markdown document
      var diagramKeywords = '(?:graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|C4Context|mindmap|timeline|zenuml|architecture)';
      var unfencedRegex = new RegExp('(?:^|\\n)\\s*(' + diagramKeywords + '(?:\\s+[A-Za-z0-9_]+)?\\b[\\s\\S]*?)(?=\\n\\s*(?:#|===|---|```|\\n\\s*\\n[A-Z0-9가-힣])|$)', 'gi');
      
      var parts = s.split(/(```[\s\S]*?```)/gi);
      for (var i = 0; i < parts.length; i += 2) {
        parts[i] = parts[i].replace(unfencedRegex, function(match, diagramBody) {
          if (/(-->|-\.-|==>|subgraph|\[|\{|=)/.test(diagramBody)) {
            return '\n```mermaid\n' + diagramBody.trim() + '\n```\n';
          }
          return match;
        });
      }
      s = parts.join('');
    }

    // 3. Image embeds ![[image.png]] or ![[image.png|alt]]
    s = s.replace(/!\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g, function (m, p, alt) {
      return "![" + (alt || "") + "](" + p.trim() + ")";
    });
    // 4. Wikilinks [[Page Name]] or [[Page Name|Alias]]
    s = s.replace(/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g, function (m, p, label) {
      return "[" + (label || p).trim() + "](#)";
    });
    return s;
  }

  // strip absolute / file:// prefixes from image and file links → leave clean basename / badge
  function stripAbsolutePaths(text) {
    if (!text) return "";
    var s = String(text);

    // 1. Convert markdown local file links [label](file:///...) -> `label` code badge
    s = s.replace(/\[([^\]]+)\]\(\s*file:\/{0,}[^)]+\)/gi, function(m, label) {
      return "`" + label.trim() + "`";
    });

    // 2. Convert raw file:/// absolute path URLs -> basename
    s = s.replace(/file:\/{0,}([^\s"'()<>]+)/gi, function(m, path) {
      var clean = path.replace(/\\/g, "/");
      var base = clean.split("/").pop() || clean;
      return base;
    });

    // 3. Convert image links ![alt](file:///path/to/img.png) -> !(img.png)
    s = s.replace(/\(\s*([^()\s]+\.(?:png|jpe?g|gif|svg|webp|bmp|avif))((?:\s+"[^"]*")?)\s*\)/gi,
      function (m, url, title) {
        if (/^https?:/i.test(url)) return m;
        var u = url.replace(/^file:\/{0,}/i, "").replace(/\\/g, "/");
        return "(" + u.split("/").pop() + (title || "") + ")";
      });

    return s;
  }

  function detectEncoding(u8) {
    if (u8.length >= 3 && u8[0] === 0xEF && u8[1] === 0xBB && u8[2] === 0xBF) return "utf-8";
    if (u8.length >= 2 && u8[0] === 0xFF && u8[1] === 0xFE) return "utf-16le";
    if (u8.length >= 2 && u8[0] === 0xFE && u8[1] === 0xFF) return "utf-16be";
    try { new TextDecoder("utf-8", { fatal: true }).decode(u8); return "utf-8"; }
    catch (e) { return "euc-kr"; }
  }

  function hasCodeFence(text) { return /(^|\n)\s*(```|~~~)/.test(text); }
  function hasMath(text) { return /\$\$[\s\S]+?\$\$|(^|[^\\$])\$[^\n$]+\$/.test(text); }
  function hasMermaid(text, name) {
    if (name && /\.(mmd|mermaid)$/i.test(name)) return true;
    if (/(^|\n)\s*(```|~~~)\s*mermaid\b/i.test(text)) return true;
    var trimmed = String(text || "").trim();
    return /^\s*(graph\s+[A-Za-z0-9_]+|flowchart\s+[A-Za-z0-9_]+|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie)\b/i.test(trimmed);
  }

  return {
    nfc: nfc, normPath: normPath, pathKey: pathKey, keyOf: keyOf, extSwap: extSwap,
    resolveImageSrc: resolveImageSrc, preprocessObsidian: preprocessObsidian, stripAbsolutePaths: stripAbsolutePaths,
    detectEncoding: detectEncoding, hasCodeFence: hasCodeFence, hasMath: hasMath, hasMermaid: hasMermaid
  };
});