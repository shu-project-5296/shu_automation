const questions = ["毎日または毎週、同じPC作業を繰り返している？", "ExcelやCSVのコピー・転記が多い？", "ファイル整理や書類作成を手作業で行っている？", "作業手順はある程度決まっている？", "その作業に時間や負担を感じている？"];
const choices = [["yes", "はい", "当てはまる"], ["no", "いいえ", "当てはまらない"], ["unknown", "わからない", "判断がつかない"]];
const endpoint = "https://shu-automation-diagnosis.taikoshuhei.chatgpt.site/api/diagnosis-event";
let step = -1;
let answers = Array(5).fill(null);

const attributionKey = "shu-automation-attribution-v1";
const landingParams = new URLSearchParams(location.search);
const landingVariant = landingParams.get("utm_source")?.toLowerCase() === "youtube" ? "youtube" : "default";

const youtubeHeadlines = {
  shorts08_invoice: "請求書作成、その作業<br><em>どこまで減らせる？</em>",
  shorts09_hp: "SNSだけで十分？<br><em>必要なホームページの形を整理</em>",
  shorts10_consult: "「これ作れる？」<br><em>方法・費用・納期の目安を整理</em>",
  shorts11_30docs: "30人分の書類作成、<br><em>まとめて減らせる？</em>",
  shorts12_rename: "50件のファイル名変更、<br><em>まとめて処理できる？</em>",
  shorts13_transfer: "毎月50件のExcel転記、<br><em>どこまで減らせる？</em>",
};

function attribution() {
  const p = new URLSearchParams(location.search);
  const hasUtm = ["utm_source", "utm_medium", "utm_campaign", "utm_content"].some((key) => p.has(key));
  if (p.has("qa") || p.get("utm_source")?.toLowerCase() === "test") {
    const test = { source: "test", medium: (p.get("utm_medium") || "qa").slice(0, 80), campaign: (p.get("utm_campaign") || "test").slice(0, 120), content: (p.get("utm_content") || "qa").slice(0, 120) };
    sessionStorage.setItem(attributionKey, JSON.stringify(test));
    return test;
  }
  const raw = (p.get("utm_source") || "").toLowerCase();
  const source = raw === "ig" ? "instagram" : ["youtube", "instagram", "tiktok", "threads", "note"].includes(raw) ? raw : raw ? "other" : "direct";
  if (hasUtm) {
    const current = { source, medium: (p.get("utm_medium") || "").slice(0, 80), campaign: (p.get("utm_campaign") || "").slice(0, 120), content: (p.get("utm_content") || "").slice(0, 120) };
    sessionStorage.setItem(attributionKey, JSON.stringify(current));
    return current;
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem(attributionKey) || "null");
    if (saved?.source) return saved;
  } catch {}
  return { source: "direct", medium: "", campaign: "", content: "" };
}

function track(event) {
  const body = JSON.stringify({ event, ...attribution(), landing_variant: landingVariant });
  try { navigator.sendBeacon(endpoint, new Blob([body], { type: "text/plain;charset=UTF-8" })); }
  catch { fetch(endpoint, { method: "POST", headers: { "content-type": "text/plain;charset=UTF-8" }, body, keepalive: true }).catch(() => {}); }
}

function startScreen() {
  if (landingVariant !== "youtube") {
    return `<section class="card"><div class="kicker">✣ 5問・約1分</div><h1>そのPC作業、<br><em>自動化できる？</em></h1><p class="lead">Excel・コピペ・書類作成など、毎日の“ちょっと面倒”を5つの質問で整理します。</p><div class="examples"><span>5問・約1分</span><span>個人情報入力不要</span><span>結果だけ見て終了でもOK</span></div><button class="primary" id="start">無料で診断を始める　→</button></section>`;
  }
  const content = landingParams.get("utm_content") || "";
  const headline = youtubeHeadlines[content] || "この作業、<br><em>どこまでラクにできる？</em>";
  return `<section class="card youtube-landing"><div class="kicker">▶ Shortsを見た方へ</div><h1>${headline}</h1><p class="youtube-intro"><b>5問・約1分で分かること</b></p><ul class="youtube-benefits"><li>自動化できそうか</li><li>どこを減らせそうか</li><li>作るならどんな方法か</li><li>ざっくり費用感</li></ul><div class="examples"><span>個人情報入力不要</span><span>結果だけ見て終了でもOK</span></div><button class="primary" id="start">この作業を無料で診断する　→</button><p class="youtube-time">5問・約1分</p></section>`;
}

function result() {
  const yes = answers.filter((x) => x === "yes").length;
  const unknown = answers.filter((x) => x === "unknown").length;
  if (yes >= 4) return ["自動化を検討しやすい作業です", "繰り返し・転記・手順が決まった作業が多く、自動化の候補になりそうです。", ["Excel・CSVの転記や集計", "定型書類の作成・保存", "ファイル名変更やフォルダ整理"]];
  if (yes >= 2 || unknown >= 2) return ["条件を整理すれば検討できそうです", "作業の一部を自動化できる可能性があります。まず手順と例外を整理するのがおすすめです。", ["繰り返し部分だけの自動化", "入力チェックや集計の補助", "作業手順の見える化"]];
  return ["今は整理から始めるのがおすすめです", "毎回の判断が多い作業は、全部を自動化するより補助機能から検討すると安全です。", ["作業時間の記録", "繰り返し部分の切り分け", "入力・確認だけを支援する小さなツール"]];
}

function render() {
  const app = document.querySelector("#app");
  if (step < 0) {
    app.innerHTML = startScreen();
    document.querySelector("#start").onclick = () => { step = 0; track("start"); render(); };
    return;
  }
  if (step < 5) {
    app.innerHTML = `<section class="card question"><div class="progress"><i style="width:${(step + 1) * 20}%"></i></div><p class="number">QUESTION ${step + 1} / 5</p><h1>${questions[step]}</h1><div class="choices">${choices.map(([v, l, n]) => `<button data-answer="${v}"><span><b>${l}</b><small>${n}</small></span><b>›</b></button>`).join("")}</div><button class="back">← 前へ戻る</button></section>`;
    document.querySelectorAll("[data-answer]").forEach((b) => b.onclick = () => { answers[step] = b.dataset.answer; if (step === 4) { step = 5; track("complete"); } else step++; render(); });
    document.querySelector(".back").onclick = () => { step = step === 0 ? -1 : step - 1; render(); };
    return;
  }
  const [label, summary, candidates] = result();
  app.innerHTML = `<section class="card result"><div class="kicker">✓ 診断結果</div><h1>${label}</h1><p class="summary">${summary}</p><div class="result-grid"><div><h2>検討できそうなこと</h2><ul>${candidates.map((x) => `<li>${x}</li>`).join("")}</ul></div><div><h2>確認しておきたいこと</h2><ul><li>使用中のシステムやファイル形式</li><li>毎回変わる判断や例外の有無</li><li>処理件数・頻度・希望する完成形</li></ul></div></div><div class="next"><h2>次に取れる行動</h2><p>まず1週間、作業の手順と所要時間をメモしてみましょう。具体的に相談したい場合は、個別の業務内容に合わせて実現方法・必要機能・概算費用・納期を整理します。</p></div><a class="cta" href="https://coconala.com/services/4398349" target="_blank" rel="noreferrer">あなたの作業を具体的に相談する　↗</a><p class="paid">個別相談では、アプリやツール本体ではなく、実現プランを文章で納品します。</p><button class="restart">↻ もう一度診断する</button><p class="disclaimer">実現可否は、使用環境・業務ルール・外部サービスの仕様や規約によって異なります。</p></section>`;
  document.querySelector(".cta").onclick = () => track("coconala_click");
  document.querySelector(".restart").onclick = () => { answers = Array(5).fill(null); step = 0; track("start"); render(); };
}

track("view");
render();
