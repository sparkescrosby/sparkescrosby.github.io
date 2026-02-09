// script.js - v3
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function setTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  const btn = $("#themeToggle");
  if (btn) btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  if (btn) btn.dataset.theme = theme;
}

function initTheme(){
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark"){
    setTheme(saved);
    return;
  }
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");
}

function initHeaderPolish(){
  const header = $(".header");
  if (!header) return;
  const onScroll = () => {
    if (window.scrollY > 10) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function initProgressBar(){
  const bar = $("#progress");
  if (!bar) return;
  const onScroll = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
    const p = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    bar.style.width = `${Math.min(100, Math.max(0, p))}%`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function estimateReadingTime(text){
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

async function loadPosts(){
  const res = await fetch("./posts/posts.json");
  if (!res.ok) throw new Error("posts.json not found");
  const data = await res.json();
  const posts = (data.posts || []).slice().sort((a,b) => (a.date < b.date ? 1 : -1));
  return posts;
}

function uniqueTags(posts){
  const set = new Set();
  posts.forEach(p => (p.tags || []).forEach(t => set.add(t)));
  return Array.from(set).sort((a,b) => a.localeCompare(b));
}

function renderTagBar(tags){
  const bar = $("#tagbar");
  if (!bar) return;
  bar.innerHTML = "";
  const all = document.createElement("button");
  all.className = "tag active";
  all.type = "button";
  all.textContent = "All";
  all.dataset.tag = "__all";
  bar.appendChild(all);

  tags.forEach(t => {
    const b = document.createElement("button");
    b.className = "tag";
    b.type = "button";
    b.textContent = t;
    b.dataset.tag = t;
    bar.appendChild(b);
  });
}

function renderPostCards(posts){
  const grid = $("#postGrid");
  if (!grid) return;
  grid.innerHTML = posts.map(p => {
    const url = `./post.html?slug=${encodeURIComponent(p.slug)}`;
    const date = p.date_display || p.date;
    return `
      <a class="glass-card" href="${url}">
        <div class="blog-card-image"></div>
        <div class="blog-card-content">
          <div class="blog-card-date">${escapeHtml(date)}</div>
          <h2>${escapeHtml(p.title)}</h2>
          <p class="blog-card-excerpt">${escapeHtml(p.excerpt || "")}</p>
          <span class="read-more">Read <span>→</span></span>
        </div>
      </a>
    `;
  }).join("");
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function initIndex(posts){
  renderTagBar(uniqueTags(posts));
  renderPostCards(posts);

  let activeTag = "__all";
  const search = $("#searchInput");

  const apply = () => {
    const q = (search?.value || "").trim().toLowerCase();
    const filtered = posts.filter(p => {
      const inTag = activeTag === "__all" || (p.tags || []).includes(activeTag);
      if (!inTag) return false;
      if (!q) return true;
      const hay = `${p.title} ${p.excerpt} ${(p.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
    renderPostCards(filtered);
  };

  $("#tagbar")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".tag");
    if (!btn) return;
    activeTag = btn.dataset.tag;
    $$(".tag", $("#tagbar")).forEach(t => t.classList.toggle("active", t === btn));
    apply();
  });

  search?.addEventListener("input", apply);

  // Keyboard shortcut: K to focus search
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)){
      e.preventDefault();
      search?.focus();
    }
  });
}

async function initPost(posts){
  const params = new URLSearchParams(location.search);
  const slug = params.get("slug");
  const post = posts.find(p => p.slug === slug) || posts[0];

  $("#postTitle").textContent = post?.title || "Post";
  $("#postDate").textContent = post?.date_display || post?.date || "";
  $("#postExcerpt").textContent = post?.excerpt || "";
  document.title = `${post?.title || "Post"} , Shane Parkes Crosby`;

  // tags
  const tagsWrap = $("#postTags");
  if (tagsWrap){
    tagsWrap.innerHTML = (post.tags || []).map(t => `<span class="tag" style="cursor:default">${escapeHtml(t)}</span>`).join("");
  }

  // load content
  const html = await fetch(`./posts/${encodeURIComponent(post.file)}`).then(r => r.text());
  const body = $("#postBody");
  body.innerHTML = html;

  // reading time
  const text = body.textContent || "";
  $("#postReadTime").textContent = estimateReadingTime(text);

  // copy link
  $("#copyLink")?.addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(location.href);
      $("#copyLink").textContent = "Copied";
      setTimeout(() => $("#copyLink").textContent = "Copy link", 1200);
    }catch{}
  });

  // prev / next
  const idx = posts.findIndex(p => p.slug === post.slug);
  const prev = posts[idx + 1];
  const next = posts[idx - 1];
  const prevA = $("#prevPost");
  const nextA = $("#nextPost");
  if (prevA){
    if (prev){
      prevA.href = `./post.html?slug=${encodeURIComponent(prev.slug)}`;
      prevA.style.display = "inline-flex";
      prevA.querySelector("span").textContent = prev.title;
    } else prevA.style.display = "none";
  }
  if (nextA){
    if (next){
      nextA.href = `./post.html?slug=${encodeURIComponent(next.slug)}`;
      nextA.style.display = "inline-flex";
      nextA.querySelector("span").textContent = next.title;
    } else nextA.style.display = "none";
  }

  // related posts
  const rel = $("#related");
  if (rel){
    const tagSet = new Set(post.tags || []);
    const related = posts
      .filter(p => p.slug !== post.slug)
      .map(p => ({p, score: (p.tags || []).reduce((acc,t)=>acc + (tagSet.has(t)?1:0), 0)}))
      .filter(x => x.score > 0)
      .sort((a,b)=> b.score - a.score || (a.p.date < b.p.date ? 1 : -1))
      .slice(0, 3)
      .map(x => x.p);

    rel.innerHTML = related.length ? related.map(p => {
      const url = `./post.html?slug=${encodeURIComponent(p.slug)}`;
      return `<a class="btn secondary" href="${url}"><span>${escapeHtml(p.title)}</span></a>`;
    }).join(" ") : `<span style="color:var(--muted)">No related posts yet.</span>`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  initHeaderPolish();
  initProgressBar();

  $("#themeToggle")?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current === "dark" ? "light" : "dark");
  });

  try{
    const posts = await loadPosts();
    if ($("#postGrid")) initIndex(posts);
    if ($("#postBody")) initPost(posts);
  }catch(e){
    // silent fail for now
  }
});
