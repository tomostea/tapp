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

// [Vue Component の仕様 · vue-loader](https://vue-loader-v14.vuejs.org/ja/start/spec.html)
// [ブラウザで覚えるES Modules入門 - JavaScriptでモジュールを使う時代 - ICS MEDIA](https://ics.media/entry/16511/)
Vue.component(VueCountdown.name, VueCountdown);
const app = new Vue({
    el: '#app',
    // [Vue.jsでinput type="number"としてもvalueは常に文字列を返すので注意！number装飾子を追加しよう - Qiita](https://qiita.com/kopkop/items/f0ad39ca96731b938796)
    template: `
    <div>

    <div>
    sha
    <input v-model="sha_raw">
    <span>{{sha_result}}</span>
    </div>

    <div>
    url
    <input v-model="url_raw">
    <button v-on:click="url_method">Do</button>
    <input type="checkbox" v-model="url_mode" value="true">encode
    <span>{{url_result}}</span>
    </div>

    <div>
    pass
    <input type="number" v-model.number="pass_length">
    <input type="checkbox" v-model="pass_mode" value="lower">a
    <input type="checkbox" v-model="pass_mode" value="upper">A
    <input type="checkbox" v-model="pass_mode" value="number">0
    <input type="checkbox" v-model="pass_mode" value="symbol">#
    <button v-on:click="pass_method">Do</button>
    <span>{{pass_result}}</span>
    </div>

    <div>
    timer
    <input v-model="timer_nums">
    <button v-on:click="timer_method">Do</button>
    <div v-for="c in timer_seconds" ref="time">
        <countdown :time="c * 1000">
            <!-- 親コンポーネント (HTML (Vueインスタンス)) がデータを受け取る時はv-slot 逆はv-bind -->
            <template v-slot="props">{{ props.days }} d {{ props.hours }} h
                {{ props.minutes }} m {{ props.seconds }} s</template>
        </countdown>
    </div>
    </div>

    <div>
    fin_json
    <input v-model="fin_json_raw">
    <span>{{fin_json_result}}</span>
    </div>

    <div>
    fin_space
    <input v-model="fin_space_raw"></input>
    <span>{{fin_space_result}}</span>
    </div>

    <div>
    od
    <input v-model="od_raw">
    <span>{{od_result}}</span>
    </div>

    <div>
    calc
    <input v-model="calc_raw">
    <span>{{calc_result}}</span>
    </div>

    <div>
    rss
    <input v-model="rss_raw">
    <button v-on:click="rss_method">Do</button>
    <span>{{rss_result}}</span>
    </div>

    <div>
    jrnl
    <input v-model="jrnl_raw">
    <button v-on:click="jrnl_method">Do</button>
    <span>{{jrnl_result}}</span>
    </div>

    <div>
    btfy
    <textarea v-model="btfy_raw"></textarea>
    <textarea v-model="btfy_result"></textarea>
    </div>

    <div>
    LA {{la}}
    </div>

    </div>
    `,
    data: {
        sha_raw: '',
        sha_result: '',
        url_raw: "",
        url_result: "",
        url_mode: [],
        pass_result: '',
        pass_length: 12,
        pass_mode: ["lower", "upper", "number"],
        timer_nums: [],
        timer_seconds: [],
        fin_json_raw: '',
        fin_json_result: 0,
        fin_space_raw: '',
        fin_space_result: 0,
        od_raw: '',
        od_result: '',
        calc_raw: '',
        calc_result: 0,
        rss_raw: '',
        rss_result: '',
        jrnl_raw: '',
        jrnl_result: '',
        btfy_raw: '',
        btfy_result: '',
        la: ''
    },
    methods: {
        url_method: function () {
            this.url_result = this.url_mode.length == 0 ? decodeURI(this.url_raw) : encodeURI(this.url_raw)
        },
        // [](https://luck2515.com/20200312/createPassword)
        pass_method: function () {
            const lowercase = "abcdefghijklmnopqrstuvwxyz"
            const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            const numbers = "0123456789"
            const symbols = "`˜!@#$%^&*()_+-={}[]|:;\"'<>,.?/"
            const length = this.pass_length;
            const useLowercase = this.pass_mode.includes("lower");
            const useUppercase = this.pass_mode.includes("upper");
            const useNumber = this.pass_mode.includes("number");
            const useSymbol = this.pass_mode.includes("symbol");
            const strList = `${useLowercase ? lowercase : ""}${useUppercase ? uppercase : ""}${useNumber ? numbers : ""}${useSymbol ? symbols : ""}`
            const secureMathRandom = () => window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967295;
            let password = ""
            for (let j = 0; j < length; j++) {
                password += strList[Math.floor(secureMathRandom() * strList.length)]
            }
            this.pass_result = password
        },
        // <button @click="addNum">{{num}}</button>
        timer_method: function () {
            this.timer_seconds = this.timer_nums.split(",")
        },
        // [rss-detect-bookmarklet/rss.js at master · aziraphale/rss-detect-bookmarklet](https://github.com/aziraphale/rss-detect-bookmarklet/blob/master/rss.js)
        rss_method: function () {
            fetch("https://cors-anywhere.herokuapp.com/" + this.rss_raw)
                .then((res) => res.text())
                .then((htmlstr) => {
                    const query = "[href$='.atom'], [href*='.atom?'], [href$='.rss'], [href*='.rss?'], [href*='/rss.'], [href*='/feed.'], [href*='/atom.'], [href*='//feeds.feedburner.com/'], [href*='/feed/'], [type='application/atom+xml'], [type='application/rss+xml']";
                    const html = new DOMParser().parseFromString(htmlstr, "text/html")
                    const elements = html.querySelectorAll(query);
                    // [querySelectorAllしてmapしたいとき[...すると短い - hitode909の日記](https://blog.sushi.money/entry/2017/04/19/114028)
                    const links = Array.from(elements).map(x => x.href)
                    this.rss_result = links.length > 0 ? links : "None"
                }).catch(e => console.error(e))
        },
        jrnl_method: function () {
            const today = new Date();
            const date = `${today.getFullYear()}-${("0" + (today.getMonth() + 1)).slice(-2)}-${("0" + today.getDate()).slice(-2)}`;
            const result = {
                P577: date,
                P793: "",
                P4271: 0,
                P135: "http://www.wikidata.org/entity/",
                P1476: "",
            };
            this.jrnl_result = JSON.stringify(result, null, 0)
            const art = this.jrnl_raw
            if (art) { window.open(`https://query.wikidata.org/#PREFIX%20rdfs:%20<http://www.w3.org/2000/01/rdf-schema#>select%20distinct%20*%20where%20{%20?s%20rdfs:label%20?o%20filter%20regex%20(?o,%20"${art}").}limit%201`); }
        }
    },
    watch: {
        // [Vue.js プロパティの変更をデータに反映する - 前人未踏の領域へ WEB・インフラ・プログラミング全般編](https://taker.hatenablog.com/entry/2020/04/07/083542)
        // [SHA256のハッシュをJavaScriptのWeb標準のライブラリだけで計算する - nwtgck / Ryo Ota](https://scrapbox.io/nwtgck/SHA256のハッシュをJavaScriptのWeb標準のライブラリだけで計算する)
        sha_raw: async function () {
            const buff = new Uint8Array([].map.call(this.sha_raw, (c) => c.charCodeAt(0))).buffer;
            const digest = await crypto.subtle.digest('SHA-256', buff);
            this.sha_result = [].map.call(new Uint8Array(digest), x => ('00' + x.toString(16)).slice(-2)).join('');
        },
        fin_json_raw: function () {
            const json = JSON.parse(this.fin_json_raw);
            const values = Object.values(json);
            const result = values.reduce((sum, n) => sum += Number(n));
            this.fin_json_result = result
        },
        fin_space_raw: function () {
            const fin_array = this.fin_space_raw.split(" ")
            const result = fin_array.reduce((sum, n) => sum += Number(n), 0);
            this.fin_space_result = result
        },
        od_raw: function () {
            const amount = 10000;
            const target = 0.1;
            const dilution = 50;
            const odraw = this.od_raw.split(",");
            const ods = odraw.map(x => parseFloat(x));
            const sum = ods.reduce((a, x) => a + x);
            const avg = sum / ods.length;
            const result = amount * (target / (dilution * avg));
            const result2 = (400 * (0.300 / avg)) / 2;
            this.od_result = `avg: ${avg}\nresult: ${result}\nresult2: ${result2}`;
        },
        calc_raw: function () {
            this.calc_result = eval(this.calc_raw);
        },
        btfy_raw: function () {
            const beautify = SimplyBeautiful();
            this.btfy_result = beautify.js(this.btfy_raw);
        }
    },
    mounted() {
        // [JavaScript - AU,SG,THそれぞれの現地時間の取得｜teratail](https://teratail.com/questions/203622)
        const date = new Date()
        this.la = date.toLocaleString('ja-JP', { timeZone: 'America/Los_Angeles' })
    }
})
