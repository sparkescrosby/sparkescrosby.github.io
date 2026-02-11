// script.js - Final (light mode)
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

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
  // Expect: /posts/posts.json
  const res = await fetch("./posts/posts.json", { cache: "no-store" });
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

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
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

  if (!posts.length){
    grid.innerHTML = `
      <div class="glass-card" style="padding:18px">
        <div class="blog-card-content" style="padding:0">
          <h2 style="margin:0 0 8px;">No posts found</h2>
          <p class="blog-card-excerpt" style="margin:0;">Try clearing your search or switching tags.</p>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = posts.map(p => {
    const url = `./post.html?slug=${encodeURIComponent(p.slug)}`;
    const mediaStyle = p.headerImage ? `style="background-image:url('${escapeHtml(p.headerImage)}')"` : "";
    const date = p.date_display || p.date;
    return `
      <a class="glass-card" href="${url}">
        <div class="card-media" ${mediaStyle}></div>
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
}

async function initPost(posts){
  const params = new URLSearchParams(location.search);
  const slug = params.get("slug");
  const post = posts.find(p => p.slug === slug) || posts[0];

  $("#postTitle").textContent = post?.title || "Post";
  $("#postDate").textContent = post?.date_display || post?.date || "";
  $("#postExcerpt").textContent = post?.excerpt || "";
  document.title = `${post?.title || "Post"} , Shane Parkes Crosby`;

  const hero = $("#postHero");
  if (hero && post?.headerImage){
    hero.style.backgroundImage = `url('${post.headerImage}')`;
  }

  const tagsWrap = $("#postTags");
  if (tagsWrap){
    tagsWrap.innerHTML = (post?.tags || []).map(t => `<span class="tag" style="cursor:default">${escapeHtml(t)}</span>`).join("");
  }

  const html = await fetch(`./posts/${encodeURIComponent(post.file)}`).then(r => r.text());
  const body = $("#postBody");
  body.innerHTML = html;

  const text = body.textContent || "";
  $("#postReadTime").textContent = estimateReadingTime(text);

  $("#copyLink")?.addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(location.href);
      $("#copyLink").textContent = "Copied";
      setTimeout(() => $("#copyLink").textContent = "Copy link", 1200);
    }catch{}
  });

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
}

function initMobileMenu(){
  const toggle = $("#menuToggle");
  const root = document.documentElement;
  const backdrop = $("#menuBackdrop");

  if (!toggle || !backdrop) return;

  const open = () => {
    root.classList.add("menu-open");
    toggle.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    root.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    if (root.classList.contains("menu-open")) close();
    else open();
  });

  backdrop.addEventListener("click", close);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  initHeaderPolish();
  initProgressBar();
  initMobileMenu();

  try{
    const posts = await loadPosts();
    if ($("#postGrid")) initIndex(posts);
    if ($("#postBody")) initPost(posts);
  }catch(e){
    const grid = $("#postGrid");
    if (grid){
      grid.innerHTML = `
        <div class="glass-card" style="padding:18px">
          <div class="blog-card-content" style="padding:0">
            <h2 style="margin:0 0 8px;">Posts didn’t load</h2>
            <p class="blog-card-excerpt" style="margin:0;">
              Check that <code>posts/posts.json</code> exists and you are running via a local server (VS Code Live Server).
            </p>
          </div>
        </div>
      `;
    }
  }
});
