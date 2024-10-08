import {
    statSync as a,
    constants as i,
    mkdirSync as l,
    writeFileSync as m,
    readFileSync as o,
    accessSync as r,
    existsSync as s,
} from "fs";
import { basename as e, dirname as n, resolve as t } from "path";

import { load as d } from "cheerio";
import { marked as c } from "marked";
import p from "puppeteer";

const u = async t => c.parse(t),
    h = async ({
        inputText: c,
        inputFilename: h,
        mdText: f,
        mdFile: g,
        outputFilename: $,
        type: y = "png",
        width: b = 800,
        height: T = 600,
        encoding: _ = "binary",
        quality: E = 100,
        htmlText: v,
        cssText: x,
        htmlTemplate: S = "default",
        cssTemplate: H = "default",
        log: M = !1,
        puppeteerProps: F = {},
    }) => {
        const U = ["jpeg", "png", "webp"],
            j = ["base64", "binary", "blob"],
            q = { html: "", data: "base64" === _ ? "" : Uint8Array.from([]), path: void 0 };
        let C = "";
        const L = h || g,
            k = c || f;
        if (L) {
            const e = t(L);
            if (!s(e)) throw new Error(`Error: input file ${e} is not exists.\n`);
            if (!a(e).isFile()) throw new Error("Error: input is not a file.\n");
            (C = o(e).toString()),
                M && process.stderr.write(`Start to convert ${e} to an image.\n`);
        } else {
            if (!k) throw new Error("Error: text or file is required to be converted.\n");
            C = k;
        }
        const D = _,
            O = "binary" === D;
        if (!j.includes(D))
            throw new Error(
                `Error: encoding type ${D} is not supported. Valid types: ${j.join(", ")}.\n`,
            );
        let P = y;
        if (!U.includes(P))
            throw new Error(
                `Error: output file type ${P} is not supported. Valid types: ${U.join(", ")}.\n`,
            );
        let V,
            W = "";
        if (O)
            if ($) {
                const r = e($),
                    i = n($),
                    o = r.split("."),
                    s = o.length;
                if (s <= 1) W = t(i, `${r}.${P}`);
                else {
                    const e = o[s - 1];
                    U.includes(e)
                        ? ((P = e), (W = t($)))
                        : (M &&
                              process.stderr.write(
                                  `Warning: output file type must be one of 'jpeg', 'png' or 'webp'. Use '${P}' type.\n`,
                              ),
                          (W = t(i, `${r}.${P}`)));
                }
            } else
                W = t(
                    "mdimg_output",
                    (function (t) {
                        const e = new Date();
                        return `mdimg_${e.getFullYear()}_${e.getMonth() + 1}_${e.getDate()}_${e.getHours()}_${e.getMinutes()}_${e.getSeconds()}_${e.getMilliseconds()}.${t}`;
                    })(P),
                );
        "png" !== P && (V = E > 0 && E <= 100 ? E : 100);
        const A = (({
            inputHtml: e,
            htmlText: n,
            cssText: s,
            htmlTemplate: a,
            cssTemplate: l,
            log: m,
        }) => {
            let p = n,
                c = s;
            if (!p) {
                let e = t(__dirname, "../template/html", `${a}.html`);
                try {
                    r(e, i.R_OK);
                } catch (n) {
                    m &&
                        process.stderr.write(
                            `Warning: HTML template ${e} is not found or unreadable. Use default HTML template.\n${n}\n`,
                        ),
                        (e = t(__dirname, "../template/html/default.html"));
                }
                p = o(e).toString();
            }
            if (!c) {
                let e = t(__dirname, "../template/css", `${l}.css`);
                try {
                    r(e, i.R_OK);
                } catch (n) {
                    m &&
                        process.stderr.write(
                            `Warning: CSS template ${e} is not found or unreadable. Use default CSS template.\n${n}\n`,
                        ),
                        (e = t(__dirname, "../template/css/default.css"));
                }
                c = o(e).toString();
            }
            const u = d(p);
            return (
                u(".markdown-body").html(e),
                `\n  <!DOCTYPE html>\n  <html lang="en">\n  <head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>mdimg</title>\n    <style>\n      ${c}\n    </style>\n  </head>\n  <body>\n    ${u.html()}\n  </body>\n  </html>`
            );
        })({
            inputHtml: await u(C),
            htmlText: v,
            cssText: x,
            htmlTemplate: w(S),
            cssTemplate: w(H),
            log: M,
        });
        q.html = A;
        const I = await p.launch({
                defaultViewport: { width: b, height: T },
                args: [`--window-size=${b},${T}`],
                ...F,
            }),
            K = await I.newPage();
        await K.setContent(A, { waitUntil: "networkidle0" });
        const R = await K.$("#mdimg-body");
        if (R) {
            if ("binary" === D || "blob" === D) {
                O &&
                    (function (t) {
                        const e = n(t);
                        try {
                            l(e, { recursive: !0 }), m(t, "");
                        } catch (e) {
                            throw new Error(`Error: create new file ${t} failed.\n${String(e)}\n`);
                        }
                    })(W);
                const t = await R.screenshot({
                    path: O ? W : void 0,
                    type: P,
                    quality: V,
                    encoding: "binary",
                });
                M &&
                    process.stderr.write(
                        `Info: convert to image${O ? ` and saved as ${W}` : ""} successfully!\n`,
                    ),
                    (q.data = t),
                    (q.path = O ? W : void 0);
            } else if ("base64" === D) {
                const t = await R.screenshot({ type: P, quality: V, encoding: "base64" });
                M && process.stderr.write("Info: convert to BASE64 encoded string successfully!\n"),
                    (q.data = t);
            }
            return await I.close(), q;
        }
        throw (
            (await I.close(),
            new Error(
                `Error: missing HTML element with id: mdimg-body.\nHTML template ${S} is not valid.\n`,
            ))
        );
    };
function w(t) {
    return t.split(".")[0];
}
export { h as convert2img, h as mdimg };
