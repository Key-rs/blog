// ============================================================================
// 酷狗音乐 → Meting 兼容适配器 (Cloudflare Pages Function)
// 签名算法与接口参数移植自 MakcRe/KuGouMusicApi (GPL-2.0) — 感谢该项目
// 用法: /api/meting/?server=kugou&type=playlist&id=<global_collection_id>
// 调试: &debug=1 返回酷狗原始响应; type=playlist_list 列出热门歌单
// ============================================================================

// ---------- 纯 JS MD5 (worker/node 通用) ----------
function md5(str) {
	function toHex(n) {
		let s = "";
		for (let i = 0; i < 4; i++)
			s += ((n >> (i * 8 + 4)) & 0x0f).toString(16) + ((n >> (i * 8)) & 0x0f).toString(16);
		return s;
	}
	function add32(a, b) {
		return (a + b) & 0xffffffff;
	}
	function cmn(q, a, b, x, s, t) {
		a = add32(add32(a, q), add32(x, t));
		return add32((a << s) | (a >>> (32 - s)), b);
	}
	function ff(a, b, c, d, x, s, t) {
		return cmn((b & c) | (~b & d), a, b, x, s, t);
	}
	function gg(a, b, c, d, x, s, t) {
		return cmn((b & d) | (c & ~d), a, b, x, s, t);
	}
	function hh(a, b, c, d, x, s, t) {
		return cmn(b ^ c ^ d, a, b, x, s, t);
	}
	function ii(a, b, c, d, x, s, t) {
		return cmn(c ^ (b | ~d), a, b, x, s, t);
	}
	function core(x) {
		let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
		for (let i = 0; i < x.length; i += 16) {
			const [oa, ob, oc, od] = [a, b, c, d];
			a=ff(a,b,c,d,x[i],7,-680876936); d=ff(d,a,b,c,x[i+1],12,-389564586); c=ff(c,d,a,b,x[i+2],17,606105819); b=ff(b,c,d,a,x[i+3],22,-1044525330);
			a=ff(a,b,c,d,x[i+4],7,-176418897); d=ff(d,a,b,c,x[i+5],12,1200080426); c=ff(c,d,a,b,x[i+6],17,-1473231341); b=ff(b,c,d,a,x[i+7],22,-45705983);
			a=ff(a,b,c,d,x[i+8],7,1770035416); d=ff(d,a,b,c,x[i+9],12,-1958414417); c=ff(c,d,a,b,x[i+10],17,-42063); b=ff(b,c,d,a,x[i+11],22,-1990404162);
			a=ff(a,b,c,d,x[i+12],7,1804603682); d=ff(d,a,b,c,x[i+13],12,-40341101); c=ff(c,d,a,b,x[i+14],17,-1502002290); b=ff(b,c,d,a,x[i+15],22,1236535329);
			a=gg(a,b,c,d,x[i+1],5,-165796510); d=gg(d,a,b,c,x[i+6],9,-1069501632); c=gg(c,d,a,b,x[i+11],14,643717713); b=gg(b,c,d,a,x[i],20,-373897302);
			a=gg(a,b,c,d,x[i+5],5,-701558691); d=gg(d,a,b,c,x[i+10],9,38016083); c=gg(c,d,a,b,x[i+15],14,-660478335); b=gg(b,c,d,a,x[i+4],20,-405537848);
			a=gg(a,b,c,d,x[i+9],5,568446438); d=gg(d,a,b,c,x[i+14],9,-1019803690); c=gg(c,d,a,b,x[i+3],14,-187363961); b=gg(b,c,d,a,x[i+8],20,1163531501);
			a=gg(a,b,c,d,x[i+13],5,-1444681467); d=gg(d,a,b,c,x[i+2],9,-51403784); c=gg(c,d,a,b,x[i+7],14,1735328473); b=gg(b,c,d,a,x[i+12],20,-1926607734);
			a=hh(a,b,c,d,x[i+5],4,-378558); d=hh(d,a,b,c,x[i+8],11,-2022574463); c=hh(c,d,a,b,x[i+11],16,1839030562); b=hh(b,c,d,a,x[i+14],23,-35309556);
			a=hh(a,b,c,d,x[i+1],4,-1530992060); d=hh(d,a,b,c,x[i+4],11,1272893353); c=hh(c,d,a,b,x[i+7],16,-155497632); b=hh(b,c,d,a,x[i+10],23,-1094730640);
			a=hh(a,b,c,d,x[i+13],4,681279174); d=hh(d,a,b,c,x[i],11,-358537222); c=hh(c,d,a,b,x[i+3],16,-722521979); b=hh(b,c,d,a,x[i+6],23,76029189);
			a=hh(a,b,c,d,x[i+9],4,-640364487); d=hh(d,a,b,c,x[i+12],11,-421815835); c=hh(c,d,a,b,x[i+15],16,530742520); b=hh(b,c,d,a,x[i+2],23,-995338651);
			a=ii(a,b,c,d,x[i],6,-198630844); d=ii(d,a,b,c,x[i+7],10,1126891415); c=ii(c,d,a,b,x[i+14],15,-1416354905); b=ii(b,c,d,a,x[i+5],21,-57434055);
			a=ii(a,b,c,d,x[i+12],6,1700485571); d=ii(d,a,b,c,x[i+3],10,-1894986606); c=ii(c,d,a,b,x[i+10],15,-1051523); b=ii(b,c,d,a,x[i+1],21,-2054922799);
			a=ii(a,b,c,d,x[i+8],6,1873313359); d=ii(d,a,b,c,x[i+15],10,-30611744); c=ii(c,d,a,b,x[i+6],15,-1560198380); b=ii(b,c,d,a,x[i+13],21,1309151649);
			a=ii(a,b,c,d,x[i+4],6,-145523070); d=ii(d,a,b,c,x[i+11],10,-1120210379); c=ii(c,d,a,b,x[i+2],15,718787259); b=ii(b,c,d,a,x[i+9],21,-343485551);
			a=add32(a,oa); b=add32(b,ob); c=add32(c,oc); d=add32(d,od);
		}
		return toHex(a) + toHex(b) + toHex(c) + toHex(d);
	}
	function utf8Bytes(s) {
		return [...new TextEncoder().encode(s)];
	}
	const bytes = utf8Bytes(str);
	const n = bytes.length;
	const bitLen = n * 8;
	const blocks = ((bitLen + 64) >>> 9) + 1;
	const words = new Array(blocks * 16).fill(0);
	for (let i = 0; i < n; i++) words[i >> 2] |= bytes[i] << ((i % 4) * 8);
	words[n >> 2] |= 0x80 << ((n % 4) * 8);
	words[blocks * 16 - 2] = bitLen;
	return core(words);
}

// ---------- 酷狗签名 (移植自 KuGouMusicApi util/helper.js) ----------
const SALT_ANDROID = "OIlwieks28dk2k092lksi2UIkp";
const SALT_KEY = "57ae12eb6890223e355ccfcb74edf70d";
const APPID = 1005;
const CLIENTVER = 20489;

function signatureAndroidParams(params, data = "") {
	const paramsString = Object.keys(params)
		.sort()
		.map((key) => {
			const v = params[key];
			return `${key}=${typeof v === "object" ? JSON.stringify(v) : v}`;
		})
		.join("");
	return md5(`${SALT_ANDROID}${paramsString}${data}${SALT_ANDROID}`);
}

function signKey(hash, mid, userid = 0, appid = APPID) {
	return md5(`${hash}${SALT_KEY}${appid}${mid}${userid || 0}`);
}

function signParamsKey(data, appid = APPID, clientver = CLIENTVER) {
	return md5(`${appid}${SALT_ANDROID}${clientver}${data}`);
}

// mid = md5(guid) 视为十六进制大整数的十进制形式
function calculateMid(digestHex) {
	return BigInt("0x" + digestHex).toString();
}

function randomString(len = 16) {
	const chars = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let s = "";
	for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
	return s;
}

// ---------- 酷狗请求 (移植自 util/request.js 的 android 流程) ----------
// 会话级稳定设备标识: 同一隔离环境内复用同一个 mid, 降低风控触发概率
let sessionMid = null;
async function kugou({ url, method = "GET", params = {}, data = null, headers = {}, randomDfid = false }) {
	if (!sessionMid) sessionMid = calculateMid(md5(crypto.randomUUID()));
	const mid = sessionMid;
	const dfid = randomDfid ? randomString(24) : "-";
	const clienttime = Math.floor(Date.now() / 1000);

	const merged = {
		dfid,
		mid,
		uuid: "-",
		appid: APPID,
		clientver: CLIENTVER,
		clienttime,
		...params,
	};
	if (merged.__needKey) {
		merged.key = signKey(merged.hash, mid, 0, APPID);
		delete merged.__needKey;
	}
	const body = data ? JSON.stringify(data) : "";
	merged.signature = signatureAndroidParams(merged, body);

	const qs = Object.keys(merged)
		.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(merged[k])}`)
		.join("&");
	const h = {
		"User-Agent": "Android15-1070-11083-46-0-DiscoveryDRADProtocol-wifi",
		dfid,
		clienttime,
		mid,
		"kg-rc": "1",
		"kg-thash": "5d816a0",
		"kg-rec": "1",
		"kg-rf": "B9EDA08A64250DEFFBCADDEE00F8F25F",
		...headers,
	};
	if (body) h["Content-Type"] = "application/json";
	const resp = await fetch(`https://gateway.kugou.com${url}?${qs}`, {
		method: body ? "POST" : "GET",
		headers: h,
		body: body || undefined,
	});
	return resp.json();
}

// ---------- 接口封装 ----------
async function kugouTopPlaylists() {
	const dateTime = Math.floor(Date.now() / 1000).toString();
	const dataMap = {
		appid: APPID,
		mid: calculateMid(md5(crypto.randomUUID())),
		clientver: CLIENTVER,
		platform: "android",
		clienttime: dateTime,
		userid: 0,
		module_id: 1,
		page: 1,
		pagesize: 20,
		key: signParamsKey(dateTime),
		special_recommend: {
			withtag: 1, withsong: 1, sort: 1, ugc: 1, is_selected: 0,
			withrecommend: 1, area_code: 1, categoryid: 0,
		},
		req_multi: 1,
		retrun_min: 5,
		return_special_falg: 1,
	};
	return kugou({
		url: "/v2/special_recommend",
		method: "POST",
		data: dataMap,
		headers: { "x-router": "specialrec.service.kugou.com" },
	});
}

async function kugouPlaylistTracks(globalCollectionId, page = 1) {
	const pagesize = 300;
	return kugou({
		url: "/pubsongs/v2/get_other_list_file_nofilt",
		params: {
			area_code: 1,
			begin_idx: (page - 1) * pagesize,
			plat: 1,
			type: 1,
			mode: 1,
			personal_switch: 1,
			extend_fields: "abtags,hot_cmt,popularization",
			pagesize,
			global_collection_id: globalCollectionId,
		},
	});
}

async function kugouSongUrl({ hash, album_id = 0, album_audio_id = 0 }) {
	return kugou({
		url: "/v5/url",
		params: {
			album_id: Number(album_id ?? 0),
			area_code: 1,
			hash: (hash || "").toLowerCase(),
			ssa_flag: "is_fromtrack",
			version: 11430,
			page_id: 151369488,
			quality: 128,
			album_audio_id: Number(album_audio_id ?? 0),
			behavior: "play",
			pid: 2,
			cmd: 26,
			pidversion: 3001,
			IsFreePart: 0,
			ppage_id: "463467626,350369493,788954147",
			cdnBackup: 1,
			module: "",
			clientver: 11430,
			__needKey: true,
		},
		headers: { "x-router": "trackercdn.kugou.com" },
		randomDfid: true,
	});
}

// ---------- Meting 格式输出 ----------
function json(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
	});
}

async function handleApi(sp) {
	const type = sp.get("type") || "playlist";
	const id = (sp.get("id") || "").trim();
	const debug = sp.get("debug") === "1";
	const server = sp.get("server") || "kugou";
	if (server !== "kugou") {
		return json({ error: `this private endpoint only supports server=kugou (got ${server})` }, 400);
	}

	try {
		if (type === "playlist_list") {
			const body = await kugouTopPlaylists();
			const lists = body?.data?.special_list ?? body?.data?.lists ?? [];
			if (debug) return json(body);
			return json(
				lists.map((x) => ({
					id: x.global_collection_id ?? x.specialid,
					name: x.specialname ?? x.name,
					author: x.nickname ?? x.singername ?? "",
					cover: x.imgurl ?? x.flexible_cover ?? "",
				})),
			);
		}

		if (type === "playlist") {
			if (!id) return json({ error: "missing id" }, 400);
			const body = await kugouPlaylistTracks(id);
			if (debug) return json(body);
			const lists = body?.data?.lists ?? body?.data?.info ?? body?.data?.songs ?? [];
			const origin = new URL(sp.get("__origin") || "https://blog-21k.pages.dev").origin;
			const tracks = lists
				.map((t, i) => {
					const name = t.name ?? t.songname ?? t.filename?.split("-")?.pop() ?? "";
					if (!name) return null;
					const singers =
						t.singers?.map((s) => s.name).join("/") ??
						t.singername ??
						t.author_name ??
						"";
					const hash = t.hash ?? t.FileHash ?? "";
					if (!hash) return null;
					return {
						name,
						artist: singers,
						url: `${origin}/api/meting/?type=url&hash=${encodeURIComponent(hash)}&album_id=${encodeURIComponent(t.album_id ?? t.albumid ?? 0)}&album_audio_id=${encodeURIComponent(t.album_audio_id ?? t.audio_id ?? 0)}`,
						pic: t.cover ?? t.imgurl ?? t.sizable_cover?.replace("{size}", "480") ?? "",
						lrc: "",
					};
				})
				.filter(Boolean);
			return json(tracks);
		}

		if (type === "url") {
			if (!sp.get("hash")) return json({ error: "missing hash" }, 400);
			const body = await kugouSongUrl({
				hash: sp.get("hash"),
				album_id: sp.get("album_id") || 0,
				album_audio_id: sp.get("album_audio_id") || 0,
			});
			if (debug) return json(body);
			const d = Array.isArray(body?.data) ? body.data[0] : body?.data;
			const playUrl = d?.url ?? d?.backupUrl ?? null;
			const url = Array.isArray(playUrl) ? playUrl[0] : playUrl;
			if (!url) return json({ error: "no url", body: body?.status }, 502);
			return new Response(null, {
				status: 302,
				headers: { Location: url, "Access-Control-Allow-Origin": "*" },
			});
		}

		return json({ error: `unknown type: ${type}` }, 400);
	} catch (e) {
		return json({ error: String(e?.message ?? e) }, 502);
	}
}

export async function onRequestGet({ request }) {
	const url = new URL(request.url);
	url.searchParams.set("__origin", url.origin);
	return handleApi(url.searchParams);
}

// 本地测试: node scripts/kugou-test.mjs
export { handleApi, md5 };
