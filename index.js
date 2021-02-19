if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then((registration) => console.log(registration.scope))
        .catch((err) => console.error(err));
}
document.querySelector('#gUM_do').onclick = () => {
    navigator.mediaDevices.getUserMedia(
        { audio: true, video: true }).then(
            (stream) => {
                const mediaRecorder = new MediaRecorder(stream);
                document.querySelector('#gUM_rec').onclick = () => mediaRecorder.start();
                document.querySelector('#gUM_stop').onclick = () => mediaRecorder.stop();
                mediaRecorder.ondataavailable = (e) => {
                    const dl = document.createElement('a');
                    dl.setAttribute('download', '');
                    const videoURL = URL.createObjectURL(e.data);
                    dl.href = videoURL;
                    dl.innerText = "DL";
                    document.querySelector('#gUM_res').appendChild(dl);
                };
            });
};
// [Browserpad - A notepad in the browser](http://browserpad.org/)
// [【JavaScript入門】Blobの使い方とダウンロード・保存方法まとめ！ | 侍エンジニア塾ブログ（Samurai Blog） - プログラミング入門者向けサイト](https://www.sejuku.net/blog/67735)
function fileSave(filedata, filename, saveid) {
    const saveA = document.querySelector(saveid);
    const blob = new Blob([filedata]);
    saveA.href = URL.createObjectURL(blob);
    saveA.download = filename;
};
async function fileRead(openid, textboxid = "", filenameid = "", mime = "plain/text") {
    const file = document.querySelector(openid).files[0];
    const readed = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        mime == "plain/text" ? reader.readAsText(file) : reader.readAsArrayBuffer(file);
        reader.onload = () => resolve(reader); // [【JavaScript入門】初心者でも分かるイベント処理の作り方まとめ！ | 侍エンジニア塾ブログ（Samurai Blog） - プログラミング入門者向けサイト](https://www.sejuku.net/blog/61631)
        reader.onerror = () => reject(reader);
    })
    if (textboxid) {
        const filenameBox = document.querySelector(filenameid);
        filenameBox.value = file.name;
        const textbox = document.querySelector(textboxid);
        textbox.value = readed.result;
    }
    return [readed.result, file.name];
}

// [SubtleCrypto.digest() - Web API | MDN](https://developer.mozilla.org/ja/docs/Web/API/SubtleCrypto/digest)
async function hashKey(text) {
    const msgUint8 = new TextEncoder().encode(text);                           // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-512', msgUint8);           // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    return hashHex;
}
function keyLoad(raw_key) {
    return new Promise((resolve, reject) => {
        resolve(window.crypto.subtle.importKey(
            "jwk", //can be "jwk" or "raw"
            {   //this is an example jwk key, "raw" would be an ArrayBuffer
                kty: "oct",
                k: raw_key, // 43bytes : 43/32=1.375 -> Base64で大きくなる分 0123456789abcdefghijklmnopqrstuvwxyzABCDEF-
                alg: "A256CTR",
                ext: true,
            },
            {   //this is the algorithm options
                name: "AES-CTR",
            },
            false, //whether the key is extractable (i.e. can be used in exportKey)
            ["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
        ))
            .catch(reject("keyLoad() error"));
    })
}
function doAESCTRenc(key, data) {
    return new Promise((resolve, reject) => {
        resolve(window.crypto.subtle.encrypt(
            {
                name: "AES-CTR",
                //Don't re-use counters!
                //Always use a new counter every time your encrypt!
                counter: new Uint8Array(16),
                length: 128, //can be 1-128
            },
            key, //from generateKey or importKey above
            data //ArrayBuffer of data you want to encrypt
        ))
            .catch(reject("doAESCTRenc() error"));
    })
}
function doAESCTRdec(key, data) {
    return new Promise((resolve, reject) => {
        resolve(window.crypto.subtle.decrypt(
            {
                name: "AES-CTR",
                counter: new ArrayBuffer(16), //The same counter you used to encrypt
                length: 128, //The same length you used to encrypt
            },
            key, //from generateKey or importKey above
            data //ArrayBuffer of the data
        ))
            .catch(reject("doAESCTRdec() error"));
    })
}
// [webcrypto-examples/README.md at master · diafygi/webcrypto-examples · GitHub](https://github.com/diafygi/webcrypto-examples/blob/master/README.md#aes-ctr)
async function doAes(keyid, inputid, dlid, enc_mode = true) {
    const [fileData, fileName] = await fileRead(inputid, "", "", "binary");
    const keyraw = document.querySelector(keyid).value;
    const hashed = await hashKey(keyraw);
    const sliced = hashed.slice(0, 43);
    const aeskey = await keyLoad(sliced)
    const dl_ = document.querySelector(dlid)
    const processed = enc_mode ? await doAESCTRenc(aeskey, fileData) : await doAESCTRdec(aeskey, fileData)
    dl_.download = fileName.match(/.aes/) ? fileName.replace(".aes", "") : `${fileName}.aes`
    fileSave(processed, dl_.download, dlid)
};

// [【JavaScript】window.btoa(‘日本語’) する at softelメモ](https://www.softel.co.jp/blogs/tech/archives/4133)
async function toDataUrlScheme(openId, resultId) {
    const [rawHtml, filename] = await fileRead(openId)
    const binary = unescape(encodeURIComponent(rawHtml))
    const encoded = btoa(binary)
    const dataUrlScheme = "data:text/html;utf-8;base64," + encoded
    const textarea = document.querySelector(resultId)
    textarea.value = dataUrlScheme
}

// [mattiasw/ExifReader: A JavaScript Exif info parser.](https://github.com/mattiasw/ExifReader/)
function readExif(openId) {
    fileRead(openId, "", "", "binary")
        .then(r => {
            const tags = ExifReader.load(r[0]);
            delete tags['MakerNote'];
            alert(JSON.stringify(tags, null, 2))
        })
}

// [RxJS入門 | 第1回 RxJSとは | CodeGrid](https://www.codegrid.net/articles/2017-rxjs-1/)

// [Vue.js プロパティの変更をデータに反映する - 前人未踏の領域へ WEB・インフラ・プログラミング全般編](https://taker.hatenablog.com/entry/2020/04/07/083542)
// [SHA256のハッシュをJavaScriptのWeb標準のライブラリだけで計算する - nwtgck / Ryo Ota](https://scrapbox.io/nwtgck/SHA256のハッシュをJavaScriptのWeb標準のライブラリだけで計算する)
const sha_rawInput$ = rxjs.fromEvent(document.querySelector("#sha_raw"), 'input');
sha_rawInput$.subscribe(e => {
    const input = document.querySelector("#sha_raw").value;
    const result = document.querySelector("#sha_result");
    const buff = new Uint8Array([].map.call(input, (c) => c.charCodeAt(0))).buffer;
    crypto.subtle.digest('SHA-256', buff).then((d) => {
        result.value = [].map.call(new Uint8Array(d), x => ('00' + x.toString(16)).slice(-2)).join('')
    })
        .catch((e) => console.error(e))
})

const url_rawClick$ = rxjs.fromEvent(document.querySelector("#url_button"), 'click');
url_rawClick$.subscribe(e => {
    const input = document.querySelector("#url_raw").value;
    const result = document.querySelector("#url_result");
    if (!document.querySelector("#url_mode").checked) {
        result.value = decodeURI(input);
    } else {
        result.value = encodeURI(input);
    };
});

// [](https://luck2515.com/20200312/createPassword)
const pass_rawClick$ = rxjs.fromEvent(document.querySelector("#pass_button"), 'click');
pass_rawClick$.subscribe(e => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz"
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const numbers = "0123456789"
    const symbols = "`˜!@#$%^&*()_+-={}[]|:;\"'<>,.?/"
    const length = Number(document.querySelector("#pass_length").value);
    const result = document.querySelector("#pass_result");
    const pass_mode = []
    document.querySelectorAll('input[name="pass_mode"]').forEach(e => {
        if (e.checked) {
            pass_mode.push(e.value)
        }
    })
    const useLowercase = pass_mode.includes("lower");
    const useUppercase = pass_mode.includes("upper");
    const useNumber = pass_mode.includes("number");
    const useSymbol = pass_mode.includes("symbol");
    const strList = `${useLowercase ? lowercase : ""}${useUppercase ? uppercase : ""}${useNumber ? numbers : ""}${useSymbol ? symbols : ""}`
    const secureMathRandom = () => window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967295;
    let password = ""
    for (let j = 0; j < length; j++) {
        password += strList[Math.floor(secureMathRandom() * strList.length)]
    }
    result.value = password
});

const fin_json_rawInput$ = rxjs.fromEvent(document.querySelector("#fin_json_raw"), 'input');
fin_json_rawInput$.subscribe(e => {
    const input = document.querySelector("#fin_json_raw").value;
    const result = document.querySelector("#fin_json_result");
    const json = JSON.parse(input);
    const values = Object.values(json);
    const sum = values.reduce((sum, n) => sum += Number(n));
    result.value = sum
})

const fin_space_rawInput$ = rxjs.fromEvent(document.querySelector("#fin_space_raw"), 'input');
fin_space_rawInput$.subscribe(e => {
    const input = document.querySelector("#fin_space_raw").value;
    const result = document.querySelector("#fin_space_result");
    const fin_array = input.split(" ")
    const sum = fin_array.reduce((sum, n) => sum += Number(n), 0);
    result.value = sum
})

const od_rawInput$ = rxjs.fromEvent(document.querySelector("#od_raw"), 'input');
od_rawInput$.subscribe(e => {
    const input = document.querySelector("#od_raw").value;
    const result = document.querySelector("#od_result");
    const amount = 10000;
    const target = 0.1;
    const dilution = 50;
    const odraw = input.split(",");
    const ods = odraw.map(x => parseFloat(x));
    const sum = ods.reduce((a, x) => a + x);
    const avg = sum / ods.length;
    const result1 = amount * (target / (dilution * avg));
    const result2 = (400 * (0.300 / avg)) / 2;
    result.value = `avg: ${avg}\nresult: ${result1}\nresult2: ${result2}`;
})

const calc_rawInput$ = rxjs.fromEvent(document.querySelector("#calc_raw"), 'input');
calc_rawInput$.subscribe(e => {
    const input = document.querySelector("#calc_raw").value;
    const result = document.querySelector("#calc_result");
    result.value = calc(input);
})

// [rss-detect-bookmarklet/rss.js at master · aziraphale/rss-detect-bookmarklet](https://github.com/aziraphale/rss-detect-bookmarklet/blob/master/rss.js)
const rss_rawClick$ = rxjs.fromEvent(document.querySelector("#rss_button"), 'click');
rss_rawClick$.subscribe(e => {
    const input = document.querySelector("#rss_raw").value;
    const result = document.querySelector("#rss_result");
    fetch("https://cors-anywhere.herokuapp.com/" + input)
        .then((res) => res.text())
        .then((htmlstr) => {
            const query = "[href$='.atom'], [href*='.atom?'], [href$='.rss'], [href*='.rss?'], [href*='/rss.'], [href*='/feed.'], [href*='/atom.'], [href*='//feeds.feedburner.com/'], [href*='/feed/'], [type='application/atom+xml'], [type='application/rss+xml']";
            const html = new DOMParser().parseFromString(htmlstr, "text/html")
            const elements = html.querySelectorAll(query);
            // [querySelectorAllしてmapしたいとき[...すると短い - hitode909の日記](https://blog.sushi.money/entry/2017/04/19/114028)
            const links = Array.from(elements).map(x => x.href)
            result.value = links.length > 0 ? links : "None"
        }).catch(e => console.error(e))
});

// [rss-detect-bookmarklet/rss.js at master · aziraphale/rss-detect-bookmarklet](https://github.com/aziraphale/rss-detect-bookmarklet/blob/master/rss.js)
const jrnl_rawClick$ = rxjs.fromEvent(document.querySelector("#jrnl_button"), 'click');
jrnl_rawClick$.subscribe(e => {
    const input = document.querySelector("#jrnl_raw").value;
    const result = document.querySelector("#jrnl_result");
    const today = new Date();
    const date = `${today.getFullYear()}-${("0" + (today.getMonth() + 1)).slice(-2)}-${("0" + today.getDate()).slice(-2)}`;
    const resultJson = {
        P577: date,
        P793: "",
        P4271: 0,
        P135: "http://www.wikidata.org/entity/",
        P1476: "",
    };
    result.value = JSON.stringify(resultJson, null, 0)
    const art = input
    if (art) { window.open(`https://query.wikidata.org/#PREFIX%20rdfs:%20<http://www.w3.org/2000/01/rdf-schema#>select%20distinct%20*%20where%20{%20?s%20rdfs:label%20?o%20filter%20regex%20(?o,%20"${art}").}limit%201`); }
});

const btfy_rawInput$ = rxjs.fromEvent(document.querySelector("#btfy_raw"), 'input');
btfy_rawInput$.subscribe(e => {
    const input = document.querySelector("#btfy_raw").value;
    const result = document.querySelector("#btfy_result");
    const beautify = SimplyBeautiful();
    result.value = beautify.js(input);
})

// [totp.js · GitHub](https://gist.github.com/matobaa/fd519dbcfff2c30cb56597194d1a4541)
const totp_rawClick$ = rxjs.fromEvent(document.querySelector("#totp_button"), 'click');
totp_rawClick$.subscribe(e => {
    const input = document.querySelector("#totp_raw").value;
    const result = document.querySelector("#totp_result");
    var b32 = s => [0, 8, 16, 24, 32, 40, 48, 56]
        .map(i => [0, 1, 2, 3, 4, 5, 6, 7]
            .map(j => s.charCodeAt(i + j)).map(c => c < 65 ? c - 24 : c - 65))
        .map(a => [(a[0] << 3) + (a[1] >> 2),
        (a[1] << 6) + (a[2] << 1) + (a[3] >> 4),
        (a[3] << 4) + (a[4] >> 1),
        (a[4] << 7) + (a[5] << 2) + (a[6] >> 3),
        (a[6] << 5) + (a[7] >> 0),
        ]).flat(),
        trunc = dv => dv.getUint32(dv.getInt8(19) & 0x0f) & 0x7fffffff,
        c = Math.floor(Date.now() / 1000 / 30);
    crypto.subtle.importKey('raw', new Int8Array(b32(input)), { name: 'HMAC', hash: { name: 'SHA-1' } }, true, ['sign'])
        .then(k => crypto.subtle.sign('HMAC', k, new Int8Array([0, 0, 0, 0, c >> 24, c >> 16, c >> 8, c])))
        .then(h => result.value = ('0' + trunc(new DataView(h))).slice(-6))
});

// [JavaScript - AU,SG,THそれぞれの現地時間の取得｜teratail](https://teratail.com/questions/203622)
const la_rawClick$ = rxjs.fromEvent(document.querySelector("#la_button"), 'click');
la_rawClick$.subscribe(e => {
    const result = document.querySelector("#la_result");
    const date = new Date()
    result.value = date.toLocaleString('ja-JP', { timeZone: 'America/Los_Angeles' })
});