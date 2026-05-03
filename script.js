const BASE_URL = "http://localhost:5000";

const LANG_COLORS = {
  JavaScript:'#f1e05a', TypeScript:'#3178c6', Python:'#3572A5',
  Java:'#b07219', 'C++':'#f34b7d', C:'#555555', 'C#':'#178600',
  Go:'#00ADD8', Rust:'#dea584', Ruby:'#701516', PHP:'#4F5D95',
  Swift:'#fa7343', Kotlin:'#A97BFF', Dart:'#00B4AB', Shell:'#89e051',
  HTML:'#e34c26', CSS:'#563d7c', Vue:'#41b883', Svelte:'#ff3e00',
  R:'#276DC3', Scala:'#c22d40', Elixir:'#6e4a7e', Haskell:'#5e5086',
  Lua:'#000080', MATLAB:'#e16737', Nix:'#7e7eff', default:'#8b949e'
};

function getLangColor(lang) {
  return LANG_COLORS[lang] || LANG_COLORS.default;
}

let langChartInst = null, commitChartInst = null, punchcardChartInst = null;

function loadDemo(u) {
  document.getElementById('usernameInput').value = u;
  analyze();
}

document.getElementById('usernameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') analyze();
});

async function analyze() {
  const username = document.getElementById('usernameInput').value.trim();
  if (!username) return;

  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('errorBox').style.display = 'none';
  document.getElementById('rateWarn').style.display = 'none';
  document.getElementById('loader').style.display = 'block';

  try {
    const [user, repos, events] = await Promise.all([
      fetch(`${BASE_URL}/user/${username}`).then(res => res.json()),
      fetch(`${BASE_URL}/repos/${username}`).then(res => res.json()),
      fetch(`${BASE_URL}/events/${username}`).then(res => res.json())
    ]);

    if (user.message) throw new Error(user.message === 'Not Found' ? `User "${username}" not found.` : user.message);
    if (!Array.isArray(repos)) throw new Error(repos.message || "Failed to fetch repositories.");
    if (!Array.isArray(events)) throw new Error(events.message || "Failed to fetch events.");

    const topRepos = repos.filter(r => !r.fork).slice(0, 10);
    const langMap = {};

    await Promise.allSettled(
      topRepos.map(async r => {
        try {
         const langs = await fetch(`${BASE_URL}/languages/${r.full_name}`).then(res => res.json());
          Object.entries(langs).forEach(([l, b]) => {
            langMap[l] = (langMap[l] || 0) + b;
          });
        } catch {}
      })
    );

    document.getElementById('loader').style.display = 'none';
    renderDashboard(user, repos, events, langMap);

  } catch (err) {
    document.getElementById('loader').style.display = 'none';
    const eb = document.getElementById('errorBox');
    eb.textContent = '✗ ' + (err.message || 'Unknown error');
    eb.style.display = 'block';
  }
}

function generatePersona(user, events, langMap) {
  const titles = [];
  
  if (user.public_repos > 50) titles.push("Serial Creator");
  
  let nightCommits = 0;
  let totalCommits = 0;
  events.filter(e => e.type === 'PushEvent').forEach(e => {
     const hour = new Date(e.created_at).getHours();
     if (hour >= 0 && hour <= 5) nightCommits++;
     totalCommits++;
  });
  if (totalCommits > 0 && (nightCommits / totalCommits) > 0.3) titles.push("Vampire Coder");
  
  let totalBytes = Object.values(langMap).reduce((a,b) => a + b, 0);
  if (totalBytes > 0) {
     const sysBytes = (langMap['C']||0) + (langMap['C++']||0) + (langMap['Rust']||0) + (langMap['Go']||0);
     if (sysBytes / totalBytes > 0.4) titles.push("Systems Architect");
     
     const webBytes = (langMap['JavaScript']||0) + (langMap['TypeScript']||0) + (langMap['HTML']||0) + (langMap['CSS']||0) + (langMap['Vue']||0);
     if (webBytes / totalBytes > 0.5) titles.push("Web Weaver");

     const dataBytes = (langMap['Python']||0) + (langMap['R']||0) + (langMap['MATLAB']||0);
     if (dataBytes / totalBytes > 0.4) titles.push("Data Wrangler");
  }
  
  if (titles.length === 0) titles.push("Code Crafter");
  return titles.join(' • ');
}

// 👉 ALL OTHER FUNCTIONS (renderDashboard, charts, etc.) REMAIN EXACTLY SAME
// (No change needed below this point)

function renderDashboard(user, repos, events, langMap) {
  // PROFILE & PERSONA
  const personaTitle = generatePersona(user, events, langMap);
  const profileCard = document.getElementById('profileCard');
  profileCard.innerHTML = `
    <img class="avatar" src="${user.avatar_url}" alt="${user.login}"/>
    <div class="profile-info">
      <div class="persona-badge">${personaTitle}</div>
      <h2>${user.name || user.login}</h2>
      <div class="login">@${user.login}</div>
      ${user.bio ? `<div class="bio">${user.bio}</div>` : ''}
      <div class="profile-meta">
        <div class="meta-item"><strong>${fmtNum(user.followers)}</strong>&nbsp;followers</div>
        <div class="meta-item"><strong>${fmtNum(user.following)}</strong>&nbsp;following</div>
        ${user.location ? `<div class="meta-item">📍 ${user.location}</div>` : ''}
        ${user.company ? `<div class="meta-item">🏢 ${user.company}</div>` : ''}
      </div>
    </div>
    <div class="profile-actions">
      <a class="gh-link" href="${user.html_url}" target="_blank">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
        View on GitHub
      </a>
    </div>
  `;

  // STATS
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);
  const pushEvents = events.filter(e => e.type === 'PushEvent');
  const totalCommits = pushEvents.reduce((s, e) => s + (e.payload?.commits?.length || 0), 0);

  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card green" style="animation-delay:0.05s">
      <div class="stat-value">${fmtNum(user.public_repos)}</div>
      <div class="stat-label">Public Repos</div>
    </div>
    <div class="stat-card blue" style="animation-delay:0.1s">
      <div class="stat-value">${fmtNum(totalStars)}</div>
      <div class="stat-label">Total Stars</div>
    </div>
    <div class="stat-card purple" style="animation-delay:0.15s">
      <div class="stat-value">${fmtNum(totalCommits)}</div>
      <div class="stat-label">Recent Commits</div>
    </div>
    <div class="stat-card orange" style="animation-delay:0.2s">
      <div class="stat-value">${fmtNum(totalForks)}</div>
      <div class="stat-label">Total Forks</div>
    </div>
  `;

  // CHARTS
  buildHeatmap(events);
  buildPunchcard(events); // NEW PUNCHCARD FEATURE
  buildLangChart(langMap);
  buildActivityChart(events);
  buildLangBar(langMap);

  // TOP REPOS
  const sortedRepos = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);
  document.getElementById('reposGrid').innerHTML = sortedRepos.map((r, i) => `
    <div class="repo-card" style="animation-delay:${i * 0.05}s">
      <div class="repo-name">
        <a href="${r.html_url}" target="_blank">${r.name}</a>
        ${r.fork ? '<span class="repo-fork-badge">fork</span>' : ''}
      </div>
      <div class="repo-desc">${r.description || '<span style="color:var(--text3);font-style:italic;">No description</span>'}</div>
      <div class="repo-meta">
        ${r.language ? `<span><span class="lang-dot" style="background:${getLangColor(r.language)}"></span>${r.language}</span>` : ''}
        <span>⭐ ${fmtNum(r.stargazers_count)}</span>
        <span>🍴 ${fmtNum(r.forks_count)}</span>
        ${r.open_issues_count > 0 ? `<span>⚠ ${r.open_issues_count}</span>` : ''}
      </div>
    </div>
  `).join('');

  // ACTIVITY FEED
  buildFeed(events);

  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('heatmapSubtitle').textContent = `${events.length} events loaded (showing last 52 weeks)`;
}

// === NEW FEATURE: BUILD PUNCHCARD ===
function buildPunchcard(events) {
  const counts = Array(7).fill(0).map(() => Array(24).fill(0));
  let maxCount = 0;

  events.filter(e => e.type === 'PushEvent').forEach(e => {
    const date = new Date(e.created_at);
    const d = date.getDay(); // 0 (Sun) to 6 (Sat)
    const h = date.getHours(); // 0 to 23
    const c = e.payload?.commits?.length || 1;
    counts[d][h] += c;
    if (counts[d][h] > maxCount) maxCount = counts[d][h];
  });

  const dataPoints = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (counts[d][h] > 0) {
        // Map size relative to maxCount (min radius 4, max radius 16)
        const r = Math.max(4, (counts[d][h] / maxCount) * 16);
        // We do 6 - d for the Y axis so Sunday appears at the top graphically
        dataPoints.push({ x: h, y: 6 - d, r: r, rawCount: counts[d][h] }); 
      }
    }
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (punchcardChartInst) punchcardChartInst.destroy();
  const ctx = document.getElementById('punchcardChart').getContext('2d');
  
  punchcardChartInst = new Chart(ctx, {
    type: 'bubble',
    data: {
      datasets: [{
        label: 'Commits',
        data: dataPoints,
        backgroundColor: 'rgba(88,166,255,0.4)', // Using the accent color (blue)
        borderColor: '#58a6ff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
         legend: { display: false },
         tooltip: {
           callbacks: {
             label: ctx => {
               const d = ctx.raw;
               return `${days[6 - d.y]} at ${d.x}:00 — ${d.rawCount} commits`;
             }
           }
         }
      },
      scales: {
        x: { 
          min: -1, max: 24,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { stepSize: 1, color: '#6e7681', font: { family: 'JetBrains Mono', size: 10 }, callback: v => v >= 0 && v <= 23 ? v + 'h' : '' }
        },
        y: { 
          min: -1, max: 7,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { 
            stepSize: 1, 
            color: '#6e7681', 
            font: { family: 'JetBrains Mono', size: 10 },
            callback: v => v >= 0 && v <= 6 ? days[6 - v].substring(0,3) : '' 
          }
        }
      }
    }
  });
}

function buildHeatmap(events) {
  const dateCount = {};
  events.forEach(e => {
    const d = e.created_at?.slice(0, 10);
    if (d) dateCount[d] = (dateCount[d] || 0) + (e.type === 'PushEvent' ? (e.payload?.commits?.length || 1) : 1);
  });

  const max = Math.max(...Object.values(dateCount), 1);
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  start.setDate(start.getDate() - start.getDay());

  const heatmap = document.getElementById('heatmap');
  heatmap.innerHTML = '';
  const tooltip = document.getElementById('tooltip');

  let cur = new Date(start);
  const colCount = Math.ceil((today - start) / (7 * 86400000));

  for (let w = 0; w < colCount; w++) {
    const col = document.createElement('div');
    col.className = 'heatmap-col';
    for (let d = 0; d < 7; d++) {
      const date = new Date(cur);
      const dateStr = date.toISOString().slice(0, 10);
      const count = dateCount[dateStr] || 0;
      const level = count === 0 ? 0 : count < max * 0.25 ? 1 : count < max * 0.5 ? 2 : count < max * 0.75 ? 3 : 4;

      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      if (level) cell.setAttribute('data-level', level);
      cell.dataset.date = dateStr;
      cell.dataset.count = count;

      cell.addEventListener('mouseenter', evt => {
        tooltip.style.display = 'block';
        tooltip.textContent = `${dateStr}: ${count} event${count !== 1 ? 's' : ''}`;
      });
      cell.addEventListener('mousemove', evt => {
        tooltip.style.left = (evt.clientX + 12) + 'px';
        tooltip.style.top = (evt.clientY - 28) + 'px';
      });
      cell.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

      col.appendChild(cell);
      cur.setDate(cur.getDate() + 1);
    }
    heatmap.appendChild(col);
  }

  const monthsEl = document.getElementById('heatmapMonths');
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  cur = new Date(start);
  const seen = new Set();
  const labels = [];
  for (let w = 0; w < colCount; w++) {
    const m = cur.getMonth();
    if (!seen.has(m)) { seen.add(m); labels.push({ w, name: monthNames[m] }); }
    cur.setDate(cur.getDate() + 7);
  }
  monthsEl.innerHTML = '';
  const totalW = colCount;
  labels.forEach(l => {
    const span = document.createElement('span');
    span.textContent = l.name;
    span.style.marginLeft = Math.max(0, (l.w / totalW) * 100 - 3) + '%';
    span.style.position = 'absolute';
    monthsEl.appendChild(span);
  });
  monthsEl.style.position = 'relative';
  monthsEl.style.height = '16px';
}

function buildLangChart(langMap) {
  const sorted = Object.entries(langMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (sorted.length === 0) return;

  const labels = sorted.map(([l]) => l);
  const data = sorted.map(([, b]) => b);
  const colors = labels.map(l => getLangColor(l));

  if (langChartInst) langChartInst.destroy();
  const ctx = document.getElementById('langChart').getContext('2d');
  langChartInst = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#0d1117', borderWidth: 2 }] },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              return ` ${ctx.label}: ${((ctx.raw / total) * 100).toFixed(1)}%`;
            }
          }
        }
      },
      cutout: '65%'
    }
  });

  const total = data.reduce((a, b) => a + b, 0);
  document.getElementById('langList').innerHTML = sorted.slice(0, 5).map(([l, b]) => `
    <div class="lang-item">
      <span class="lang-dot" style="background:${getLangColor(l)}"></span>
      ${l} <span class="lang-pct">${((b / total) * 100).toFixed(1)}%</span>
    </div>
  `).join('');
}

function buildActivityChart(events) {
  const now = new Date();
  const buckets = {};
  for (let i = 12; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }

  events.forEach(e => {
    const d = new Date(e.created_at);
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays > 91) return;
    const weekStart = new Date(d);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    if (key in buckets) buckets[key]++;
    else {
      const keys = Object.keys(buckets);
      if (keys.length > 0) buckets[keys[0]]++;
    }
  });

  const labels = Object.keys(buckets).map(k => k.slice(5));
  const data = Object.values(buckets);

  if (commitChartInst) commitChartInst.destroy();
  const ctx = document.getElementById('commitChart').getContext('2d');
  commitChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Events',
        data,
        backgroundColor: 'rgba(57,211,83,0.4)',
        borderColor: '#39d353',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#6e7681', font: { family: 'JetBrains Mono', size: 10 }, maxTicksLimit: 6 }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#6e7681', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true }
      }
    }
  });
}

function buildLangBar(langMap) {
  const sorted = Object.entries(langMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (sorted.length === 0) return;
  const total = sorted.reduce((s, [, b]) => s + b, 0);

  document.getElementById('langBar').innerHTML = sorted.map(([l, b]) => `
    <div class="lang-segment" style="background:${getLangColor(l)};flex:${b};" title="${l}: ${((b/total)*100).toFixed(1)}%"></div>
  `).join('');

  document.getElementById('langBarList').innerHTML = sorted.map(([l, b]) => `
    <div class="lang-item">
      <span class="lang-dot" style="background:${getLangColor(l)}"></span>
      <span>${l}</span>
      <span class="lang-pct">${((b / total) * 100).toFixed(1)}%</span>
    </div>
  `).join('');
}

function buildFeed(events) {
  const icons = {
    PushEvent: { icon: '⬆', cls: 'feed-push' },
    CreateEvent: { icon: '✦', cls: 'feed-create' },
    WatchEvent: { icon: '★', cls: 'feed-watch' },
    ForkEvent: { icon: '⑂', cls: 'feed-fork' },
    PullRequestEvent: { icon: '⤵', cls: 'feed-pr' },
    IssuesEvent: { icon: '!', cls: 'feed-issue' },
    IssueCommentEvent: { icon: '💬', cls: 'feed-issue' },
    DeleteEvent: { icon: '✕', cls: 'feed-create' },
  };

  function describeEvent(e) {
    const repo = `<span class="repo-ref">${e.repo?.name || ''}</span>`;
    switch (e.type) {
      case 'PushEvent':
        const n = e.payload?.commits?.length || 0;
        return `Pushed ${n} commit${n !== 1 ? 's' : ''} to ${repo}`;
      case 'CreateEvent':
        return `Created ${e.payload?.ref_type || 'branch'} in ${repo}`;
      case 'WatchEvent':
        return `Starred ${repo}`;
      case 'ForkEvent':
        return `Forked ${repo}`;
      case 'PullRequestEvent':
        return `${e.payload?.action || 'Opened'} pull request in ${repo}`;
      case 'IssuesEvent':
        return `${e.payload?.action || 'Opened'} issue in ${repo}`;
      case 'IssueCommentEvent':
        return `Commented on issue in ${repo}`;
      case 'DeleteEvent':
        return `Deleted ${e.payload?.ref_type || 'ref'} in ${repo}`;
      default:
        return `${e.type.replace('Event', '')} in ${repo}`;
    }
  }

  const feed = document.getElementById('activityFeed');
  feed.innerHTML = events.slice(0, 20).map((e, i) => {
    const { icon, cls } = icons[e.type] || { icon: '◆', cls: 'feed-create' };
    return `
      <div class="feed-item" style="animation-delay:${i * 0.03}s">
        <div class="feed-icon ${cls}">${icon}</div>
        <div class="feed-content">
          <div class="feed-main">${describeEvent(e)}</div>
          <div class="feed-time">${timeAgo(e.created_at)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n?.toString() || '0';
}