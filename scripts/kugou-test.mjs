// 酷狗适配器本地端到端测试: 歌单列表 → 曲目 → 播放直链
import { handleApi, md5 } from "../functions/api/meting/index.js";

console.log("md5 自检:", md5("abc") === "900150983cd24fb0d6963f7d28e17f72" && md5("") === "d41d8cd98f00b204e9800998ecf8427e" ? "OK" : `FAIL ${md5("abc")}`);

function q(o) {
	const s = new URLSearchParams(o);
	s.set("__origin", "http://localhost:4321");
	return s;
}

// 1. 热门歌单列表（用来拿真实 global_collection_id 测试）
const lists = await (await handleApi(q({ type: "playlist_list" }))).json();
console.log("热门歌单数:", lists.length);
console.log(lists.slice(0, 3));
if (!lists.length) {
	console.log("!! 歌单列表为空, 中止 (用 ?debug=1 看原始响应)");
	process.exit(1);
}

// 2. 取第一个歌单的曲目
const id = lists[0].id;
console.log(`\n测试歌单: ${lists[0].name} (${id})`);
const tracks = await (await handleApi(q({ type: "playlist", id }))).json();
console.log("曲目数:", tracks.length);
console.log(tracks.slice(0, 2));
if (!tracks.length) {
	console.log("!! 曲目为空, 中止");
	process.exit(1);
}

// 3. 解析第一首的播放直链并验证音频可达
const u = new URL(tracks[0].url);
const ur = await handleApi(
	q({
		type: "url",
		hash: u.searchParams.get("hash"),
		album_id: u.searchParams.get("album_id"),
		album_audio_id: u.searchParams.get("album_audio_id"),
	}),
);
console.log("\n取链状态:", ur.status);
const loc = ur.headers.get("location");
console.log("直链:", loc ? loc.slice(0, 100) + "..." : await ur.text());
if (ur.status === 302 && loc) {
	const audio = await fetch(loc, { headers: { Range: "bytes=0-1024" } });
	console.log("音频可达:", audio.status, audio.headers.get("content-type"), audio.headers.get("content-range") ?? audio.headers.get("content-length"));
}
console.log("\n✅ 全链路测试完成");
