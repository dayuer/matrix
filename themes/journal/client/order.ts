/**
 * order.ts — 移动端叫车对话式交互引擎
 *
 * 职责：
 * 1. GPS 定位 → /api/geo reverse → 自动填充起点
 * 2. 对话引擎（用户气泡 + AI 解析卡片），调用 /api/parse
 * 3. 需求卡片渲染与编辑
 * 4. 确认下单 → 验证流（一键登录 / Magic Link + 轮询）
 * 5. 登录态管理（localStorage 读写 loginCredential）
 * 6. 回头客常用地址前置
 * 7. 3 秒超时逃生门
 */
(function () {
  'use strict';

  // ── DOM 节点 ──
  const $ = (id: string) => document.getElementById(id);
  const chatThread = $('chatThread') as HTMLElement;
  const textInput = $('textInput') as HTMLInputElement;
  const sendBtn = $('sendBtn') as HTMLButtonElement;
  const orderCard = $('orderCard') as HTMLElement;
  const cardOrigin = $('cardOrigin') as HTMLElement;
  const cardDest = $('cardDest') as HTMLElement;
  const cardPrice = $('cardPrice') as HTMLElement;
  const confirmBtn = $('confirmOrder') as HTMLButtonElement;
  const verifyPanel = $('verifyPanel') as HTMLElement;
  const phoneInput = $('phoneNumber') as HTMLInputElement;
  const sendMagicBtn = $('sendMagicLink') as HTMLButtonElement;
  const waitingPanel = $('waitingPanel') as HTMLElement;
  const escapePanel = $('escapePanel') as HTMLElement;
  const cityName = $('cityName') as HTMLElement;
  const greetingText = $('greetingText') as HTMLElement;
  const shortcuts = $('shortcuts') as HTMLElement;
  const toggleMore = $('toggleMore') as HTMLButtonElement;
  const cardMore = $('cardMore') as HTMLElement;
  const loginBtn = $('loginBtn') as HTMLButtonElement;
  const resendBtn = $('resendBtn') as HTMLButtonElement;
  const citySelector = $('citySelector') as HTMLButtonElement;
  const cityDropdown = $('cityDropdown') as HTMLElement;
  const cityClose = $('cityClose') as HTMLButtonElement;
  const citySearch = $('citySearch') as HTMLInputElement;
  const cityListEl = $('cityList') as HTMLElement;
  const riderPhoneInput = $('riderPhone') as HTMLInputElement;
  const orderNoteInput = $('orderNote') as HTMLInputElement;
  const oneclickBtn = $('oneclickBtn') as HTMLButtonElement;
  const oneclickText = $('oneclickText') as HTMLElement;
  const agreeCheck = $('agreeCheck') as HTMLInputElement;

  // ── 状态 ──
  interface OrderDraft {
    origin?: { name: string; lng?: number; lat?: number; confirmed?: boolean };
    destination?: { name: string; lng?: number; lat?: number };
    riderPhone?: string;
    note?: string;
  }

  let currentCity = '';
  let draft: OrderDraft = {};
  let chatHistory: string[] = [];
  let sessionId = '';
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let loginCredential: string | null = null;
  let coveredCities: Set<string> = new Set();

  // ── 工具函数 ──
  function generateSessionId(): string {
    return 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  /** 漏斗埋点：开场输入 → AI 出卡 → 确认叫代驾 → 验证成功 */
  function track(event: string): void {
    const w = window as unknown as {
      gtag?: (...a: unknown[]) => void;
      _hmt?: unknown[][];
      dataLayer?: unknown[];
    };
    try {
      if (typeof w.gtag === 'function') w.gtag('event', event, { funnel: 'order' });
      else if (Array.isArray(w._hmt)) w._hmt.push(['_trackEvent', 'order', event]);
      else if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event });
    } catch { /* 埋点失败不影响主流程 */ }
  }

  /** 服务范围校验：城市未在开通列表内（且列表已加载）→ 视为未覆盖 */
  function isCovered(city: string): boolean {
    if (!city || coveredCities.size === 0) return true; // 列表未知 → 放行，避免误拦真实单
    for (const c of coveredCities) {
      if (c.includes(city) || city.includes(c)) return true;
    }
    return false;
  }

  function getStoredLogin(): string | null {
    try { return localStorage.getItem('edj_login'); } catch { return null; }
  }

  function storeLogin(token: string): void {
    try { localStorage.setItem('edj_login', token); } catch { /* 隐私模式降级 */ }
  }

  function getStoredAddresses(): { name: string; label: string }[] {
    try {
      const raw = localStorage.getItem('edj_addresses');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function saveAddress(addr: { name: string; label: string }): void {
    try {
      const list = getStoredAddresses().filter(a => a.name !== addr.name);
      list.unshift(addr);
      localStorage.setItem('edj_addresses', JSON.stringify(list.slice(0, 5)));
    } catch { /* 隐私模式降级 */ }
  }

  // ── 气泡渲染 ──
  function addBubble(type: 'user' | 'assistant', html: string): HTMLElement {
    const div = document.createElement('div');
    div.className = `chat-bubble chat-bubble--${type}`;
    if (type === 'assistant') {
      div.innerHTML = `<div class="chat-bubble__avatar">🚗</div><div class="chat-bubble__body">${html}</div>`;
    } else {
      div.innerHTML = `<div class="chat-bubble__body">${html}</div>`;
    }
    // 插入到 orderCard 之前（如果 orderCard 在 chatThread 中）或末尾
    chatThread.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return div;
  }

  function addLoading(): HTMLElement {
    return addBubble('assistant', '<span class="chat-loading">思考中<span class="chat-loading__dots">...</span></span>');
  }

  // ── API 调用 ──
  async function apiPost(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      return { ok: resp.ok, status: resp.status, data };
    } catch {
      return { ok: false, status: 0, data: { error: 'network_error' } };
    }
  }

  async function apiGet(url: string): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      return { ok: resp.ok, status: resp.status, data };
    } catch {
      return { ok: false, status: 0, data: { error: 'network_error' } };
    }
  }

  // ── GPS 定位 ──
  function requestGPS(): void {
    if (!navigator.geolocation) {
      cityName.textContent = '手动选城市';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { longitude, latitude } = pos.coords;
        const resp = await apiPost('/api/geo', { type: 'reverse', lng: longitude, lat: latitude, city: '' });
        if (resp.ok && resp.data.pois) {
          const pois = resp.data.pois as { name: string; lng: number; lat: number }[];
          const addr = resp.data.address as string || '';
          currentCity = addr.slice(0, 2) || '北京';
          cityName.textContent = currentCity;
          if (pois.length > 0 && !draft.origin) {
            draft.origin = { name: pois[0].name, lng: pois[0].lng, lat: pois[0].lat, confirmed: false };
          }
        }
      },
      () => {
        cityName.textContent = '手动选城市';
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  }

  /** 创建一个流式 AI 气泡，返回可动态追加内容的句柄 */
  function createStreamBubble(): {
    el: HTMLElement;
    bodyEl: HTMLElement;
    thinkEl: HTMLElement;
    contentEl: HTMLElement;
    appendThinking: (text: string) => void;
    appendContent: (text: string) => void;
    finalize: () => void;
  } {
    const div = document.createElement('div');
    div.className = 'chat-bubble chat-bubble--assistant';
    div.innerHTML = [
      '<div class="chat-bubble__avatar">🚗</div>',
      '<div class="chat-bubble__body">',
      '  <div class="chat-stream-think" style="display:none">',
      '    <button class="chat-stream-think__toggle">💭 思考过程 <span class="chat-stream-think__arrow">▶</span></button>',
      '    <div class="chat-stream-think__content" style="display:none"></div>',
      '  </div>',
      '  <div class="chat-stream-content"></div>',
      '</div>',
    ].join('');
    chatThread.appendChild(div);

    const bodyEl = div.querySelector('.chat-bubble__body') as HTMLElement;
    const thinkEl = div.querySelector('.chat-stream-think') as HTMLElement;
    const thinkContent = div.querySelector('.chat-stream-think__content') as HTMLElement;
    const contentEl = div.querySelector('.chat-stream-content') as HTMLElement;
    const toggleBtn = div.querySelector('.chat-stream-think__toggle') as HTMLElement;
    const arrow = div.querySelector('.chat-stream-think__arrow') as HTMLElement;

    // 思考过程折叠/展开
    toggleBtn.addEventListener('click', () => {
      const hidden = thinkContent.style.display === 'none';
      thinkContent.style.display = hidden ? 'block' : 'none';
      arrow.textContent = hidden ? '▼' : '▶';
    });

    return {
      el: div,
      bodyEl,
      thinkEl,
      contentEl,
      appendThinking(text: string) {
        thinkEl.style.display = 'block';
        thinkContent.textContent += text;
        div.scrollIntoView({ behavior: 'smooth', block: 'end' });
      },
      appendContent(text: string) {
        contentEl.textContent += text;
        div.scrollIntoView({ behavior: 'smooth', block: 'end' });
      },
      finalize() {
        // 最终化：把纯文本内容转为 HTML 段落
        const rawText = contentEl.textContent || '';
        // 清理 markdown code block（```json...```）— 不展示给用户
        const cleaned = rawText.replace(/```json[\s\S]*?```/g, '').trim();
        if (cleaned) {
          contentEl.innerHTML = '<p>' + cleaned.replace(/\n/g, '<br>') + '</p>';
        } else {
          contentEl.innerHTML = '';
        }
      },
    };
  }

  // ── 对话解析 ──
  let parseTimeout: ReturnType<typeof setTimeout> | null = null;

  async function handleUserInput(text: string): Promise<void> {
    if (!text.trim()) return;

    // 渲染用户气泡
    addBubble('user', `<p>${text}</p>`);
    if (chatHistory.length === 0) track('input_start'); // 漏斗①：开场输入
    chatHistory.push(text);
    textInput.value = '';
    sendBtn.disabled = true;

    // 显示加载态
    const loading = addLoading();

    // 5 秒超时逃生门（流式给予更多时间）
    parseTimeout = setTimeout(() => {
      escapePanel.style.display = 'block';
    }, 5000);

    try {
      const resp = await fetch('/api/parse/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, city: currentCity }),
      });

      // 清除加载态
      loading.remove();

      if (!resp.ok || !resp.body) {
        if (parseTimeout) { clearTimeout(parseTimeout); parseTimeout = null; }
        escapePanel.style.display = 'none';
        addBubble('assistant', '<p>网络异常，请重试或拨打 <a href="tel:95139">95139</a></p>');
        return;
      }

      // 创建流式气泡
      const stream = createStreamBubble();
      let gotFirstChunk = false;

      // 用 ReadableStream 消费 SSE
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResult: {
        intent: string;
        card: OrderDraft;
        missing: string[];
        ask?: string;
        confidence: number;
        futureTimeDetected: boolean;
      } | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event: ')) {
            // SSE 事件类型行，存储供下一个 data 行使用
            (reader as unknown as { __lastEvent: string }).__lastEvent = trimmed.slice(7);
            continue;
          }

          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          const eventType = (reader as unknown as { __lastEvent?: string }).__lastEvent || 'chunk';

          try {
            const data = JSON.parse(jsonStr);

            if (eventType === 'chunk') {
              if (!gotFirstChunk) {
                gotFirstChunk = true;
                // 首个 chunk 到达 → 清除超时逃生门
                if (parseTimeout) { clearTimeout(parseTimeout); parseTimeout = null; }
                escapePanel.style.display = 'none';
              }

              if (data.thinking) {
                stream.appendThinking(data.delta);
              } else {
                stream.appendContent(data.delta);
              }
            } else if (eventType === 'result') {
              finalResult = data;
            }
          } catch {
            // SSE JSON 解析失败：忽略
          }
        }
      }

      // 清除超时（以防流过快没有触发到 gotFirstChunk）
      if (parseTimeout) { clearTimeout(parseTimeout); parseTimeout = null; }
      escapePanel.style.display = 'none';

      // 最终化气泡显示
      stream.finalize();

      // 处理结构化结果
      if (!finalResult) {
        // 没有收到 result 事件：保留流式文本，不做后续处理
        return;
      }

      const result = finalResult;

      // 意图分流
      if (result.intent === 'other') {
        addBubble('assistant', '<p>这个需求暂时无法在线处理，请联系客服 <a href="tel:95139">95139</a></p>');
        return;
      }

      // 预约意图拦截（一期只做立即单）
      if (result.futureTimeDetected) {
        addBubble('assistant', '<p>目前仅支持现在叫车。预约功能即将上线，您也可以拨打 <a href="tel:95139">95139</a> 预约。</p>');
        return;
      }

      // 合并 draft
      if (result.card.origin) draft.origin = result.card.origin;
      if (result.card.destination) draft.destination = result.card.destination;

      // 有追问（流式回复已包含追问语，但如果气泡内容为空则补充显示 ask）
      if (result.ask && !stream.contentEl.textContent?.trim()) {
        addBubble('assistant', `<p>${result.ask}</p>`);
      }

      // 两要素齐全 → 渲染确认卡片
      if (draft.origin?.name && draft.destination?.name) {
        showOrderCard();
      }
    } catch {
      // fetch 级别异常
      loading.remove();
      if (parseTimeout) { clearTimeout(parseTimeout); parseTimeout = null; }
      escapePanel.style.display = 'none';
      addBubble('assistant', '<p>网络异常，请重试或拨打 <a href="tel:95139">95139</a></p>');
    }
  }

  // ── 需求卡片 ──
  function showOrderCard(): void {
    cardOrigin.textContent = draft.origin?.name || '—';
    cardDest.textContent = draft.destination?.name || '—';
    cardPrice.textContent = '预估 ¥58 - ¥128（以司机确认为准）';

    // 起点保守：GPS 自动填入（confirmed:false）必须用户显式确认，防漂移扑空。
    const needConfirm = draft.origin && draft.origin.confirmed === false;
    cardOrigin.classList.toggle('order-card__value--unconfirmed', !!needConfirm);
    confirmBtn.textContent = needConfirm ? '确认起点 · 叫代驾' : '确认叫代驾';

    orderCard.style.display = 'block';
    orderCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    track('card_shown'); // 漏斗②：AI 出卡
  }

  /** 修改卡片字段（起点 / 终点），起点改动即视为已确认 */
  function editField(field: 'origin' | 'destination'): void {
    const label = field === 'origin' ? '起点' : '终点';
    const current = draft[field]?.name || '';
    const next = prompt(`修改${label}`, current);
    if (next === null) return;
    const name = next.trim();
    if (!name) return;
    if (field === 'origin') {
      draft.origin = { name, confirmed: true };
    } else {
      draft.destination = { name };
    }
    showOrderCard();
  }

  /** 点「确认叫代驾」：服务范围校验 + 收集可选项 + 显式确认起点 → 进入验证流 */
  function onConfirm(): void {
    // 服务范围校验：未开通城市不放进下单链路，给出口
    if (!isCovered(currentCity)) {
      addBubble(
        'assistant',
        `<p>抱歉，${currentCity || '当前城市'}暂未开通 e代驾服务。您可以<a href="#" id="switchCityLink">切换城市</a>，或拨打 <a href="tel:95139">95139</a> 咨询。</p>`,
      );
      const link = document.getElementById('switchCityLink');
      link?.addEventListener('click', (e) => {
        e.preventDefault();
        citySelector.click();
      });
      return;
    }

    track('confirm_click'); // 漏斗③：确认叫代驾

    // 可选：乘车人手机号（替朋友叫）
    const rp = riderPhoneInput?.value.trim() || '';
    if (rp && !/^1\d{10}$/.test(rp)) {
      riderPhoneInput.classList.add('order-card__input--error');
      riderPhoneInput.focus();
      return;
    }
    riderPhoneInput?.classList.remove('order-card__input--error');
    draft.riderPhone = rp || undefined;

    // 可选：备注（助手已自动带入的也可在此覆盖）
    const note = orderNoteInput?.value.trim() || '';
    draft.note = note || undefined;

    // 显式确认起点
    if (draft.origin) draft.origin.confirmed = true;

    showVerifyPanel();
  }

  // ── 验证流 ──
  function showVerifyPanel(): void {
    verifyPanel.style.display = 'block';
    orderCard.style.display = 'none';

    // 检查是否有持久登录态
    loginCredential = getStoredLogin();
    if (loginCredential) {
      // 回头客：直接用 login 凭证下单（掏手机号卡点对其消失）
      submitOrder('login', loginCredential);
      return;
    }

    // 主路径：运营商一键登录（需页面注入 carrier token，由运营商号码认证 SDK 提供）
    const w = window as unknown as { __CARRIER_TOKEN__?: string; __CARRIER_MASK__?: string };
    if (w.__CARRIER_TOKEN__) {
      oneclickBtn.style.display = 'block';
      oneclickText.textContent = w.__CARRIER_MASK__
        ? `本机号 ${w.__CARRIER_MASK__} 一键下单`
        : '本机号一键下单';
    } else {
      oneclickBtn.style.display = 'none';
    }

    // 兜底路径：Magic Link 短信（一键登录不可用 / 用户选其他号码时）
    verifyPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /** 协议勾选校验：未勾选则提示并拦截（默认勾选，极少触发） */
  function agreed(): boolean {
    if (agreeCheck && !agreeCheck.checked) {
      addBubble('assistant', '<p>请先勾选并同意《服务协议》《隐私政策》</p>');
      agreeCheck.focus();
      return false;
    }
    return true;
  }

  async function sendMagicLink(): Promise<void> {
    if (!agreed()) return;
    const phone = phoneInput.value.trim();
    if (!/^1\d{10}$/.test(phone)) {
      phoneInput.classList.add('verify-panel__tel--error');
      return;
    }
    phoneInput.classList.remove('verify-panel__tel--error');
    sendMagicBtn.disabled = true;
    sendMagicBtn.textContent = '发送中…';

    sessionId = generateSessionId();

    const resp = await apiPost('/api/verify/send', { phone, draft, sessionId });

    if (!resp.ok) {
      sendMagicBtn.disabled = false;
      sendMagicBtn.textContent = '发送验证短信';
      if (resp.status === 429) {
        addBubble('assistant', '<p>发送次数过多。请拨打 <a href="tel:95139">95139</a> 人工下单。</p>');
      }
      return;
    }

    // 进入等待态
    (document.getElementById('phoneInput') as HTMLElement).style.display = 'none';
    waitingPanel.style.display = 'block';

    // 开始轮询验证状态
    startPolling();
  }

  function startPolling(): void {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      const resp = await apiGet(`/api/verify/poll?sessionId=${sessionId}`);
      if (resp.ok && resp.data.verified) {
        // 验证成功！
        track('verify_success'); // 漏斗④：验证成功
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }

        const orderId = resp.data.orderId as string;
        const queryToken = resp.data.queryToken as string;
        const credential = resp.data.loginCredential as string;

        // 持久化登录态
        storeLogin(credential);

        // 保存常用地址
        if (draft.destination?.name) {
          saveAddress({ name: draft.destination.name, label: draft.destination.name });
        }

        // 跳转到状态页
        window.location.href = `/order/status/${queryToken}`;
      }
    }, 2000);
  }

  async function submitOrder(authType: string, token: string): Promise<void> {
    const resp = await apiPost('/api/order', {
      auth: { type: authType, token },
      draft,
    });

    if (!resp.ok) {
      addBubble('assistant', '<p>下单失败，请重试或拨打 <a href="tel:95139">95139</a></p>');
      verifyPanel.style.display = 'none';
      orderCard.style.display = 'block';
      return;
    }

    track('verify_success'); // 漏斗④：验证成功（一键登录 / 回头客免验证）

    const queryToken = resp.data.queryToken as string;
    const credential = resp.data.loginCredential as string;

    // 持久化
    storeLogin(credential);
    if (draft.destination?.name) {
      saveAddress({ name: draft.destination.name, label: draft.destination.name });
    }

    // 跳转
    window.location.href = `/order/status/${queryToken}`;
  }

  // ── 回头客常用地址 ──
  function renderShortcuts(): void {
    const addrs = getStoredAddresses();
    if (addrs.length === 0) return;

    shortcuts.innerHTML = '';
    addrs.forEach(addr => {
      const btn = document.createElement('button');
      btn.className = 'chat-shortcut';
      btn.textContent = `📍 ${addr.label}`;
      btn.addEventListener('click', () => {
        draft.destination = { name: addr.name };
        if (draft.origin?.name) {
          showOrderCard();
        } else {
          addBubble('user', `<p>去${addr.name}</p>`);
          addBubble('assistant', '<p>你在哪？</p>');
        }
      });
      shortcuts.appendChild(btn);
    });
    shortcuts.style.display = 'flex';
  }

  // ── 初始化回头客状态 ──
  function initReturningUser(): void {
    loginCredential = getStoredLogin();
    if (loginCredential) {
      greetingText.textContent = '欢迎回来！去哪儿？';
      loginBtn.textContent = '已登录';
      loginBtn.disabled = true;
    }
    renderShortcuts();
  }

  // ── 事件绑定 ──
  function bindEvents(): void {
    // 文字输入
    textInput.addEventListener('input', () => {
      sendBtn.disabled = !textInput.value.trim();
    });

    textInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        handleUserInput(textInput.value);
      }
    });

    sendBtn.addEventListener('click', () => {
      handleUserInput(textInput.value);
    });

    // 确认叫代驾（收集可选项 + 确认起点）
    confirmBtn.addEventListener('click', onConfirm);

    // 卡片字段点改（起点 / 终点）
    orderCard.querySelectorAll('.order-card__edit').forEach((el) => {
      el.addEventListener('click', () => {
        const field = (el as HTMLElement).getAttribute('data-field');
        if (field === 'origin' || field === 'destination') editField(field);
      });
    });

    // 一键登录（主路径）
    oneclickBtn.addEventListener('click', () => {
      if (!agreed()) return;
      const w = window as unknown as { __CARRIER_TOKEN__?: string };
      if (w.__CARRIER_TOKEN__) submitOrder('carrier', w.__CARRIER_TOKEN__);
    });

    // 发送 Magic Link
    sendMagicBtn.addEventListener('click', sendMagicLink);

    // 重新发送
    resendBtn.addEventListener('click', () => {
      waitingPanel.style.display = 'none';
      (document.getElementById('phoneInput') as HTMLElement).style.display = 'block';
      sendMagicBtn.disabled = false;
      sendMagicBtn.textContent = '发送验证短信';
    });

    // 更多选项切换
    toggleMore.addEventListener('click', () => {
      const visible = cardMore.style.display !== 'none';
      cardMore.style.display = visible ? 'none' : 'block';
      toggleMore.textContent = visible ? '更多选项' : '收起';
    });

    // 老客户登录
    loginBtn.addEventListener('click', () => {
      // 简化：弹出手机号输入
      const phone = prompt('请输入您的手机号');
      if (phone && /^1\d{10}$/.test(phone)) {
        // 走 Magic Link 验证
        phoneInput.value = phone;
        showVerifyPanel();
      }
    });

    // ── 城市选择器 ──
    citySelector.addEventListener('click', () => {
      cityDropdown.style.display = 'flex';
      citySelector.classList.add('city-selector--open');
      citySearch.value = '';
      filterCities('');
      citySearch.focus();
    });

    cityClose.addEventListener('click', closeCityDropdown);

    // 搜索过滤
    citySearch.addEventListener('input', () => {
      filterCities(citySearch.value.trim());
    });

    // 城市选中（事件委托）
    cityListEl.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('city-item')) {
        const city = target.getAttribute('data-city');
        if (city) {
          currentCity = city;
          cityName.textContent = city;
          closeCityDropdown();
          reparseForCity(); // 切城即重置检索域并重解析
        }
      }
    });

    // 字母索引跳转（阻止默认锚点行为，改用 smooth scroll）
    const indexEl = $('cityIndex') as HTMLElement;
    indexEl.addEventListener('click', (e: Event) => {
      e.preventDefault();
      const target = e.target as HTMLAnchorElement;
      if (target.classList.contains('city-dropdown__letter')) {
        const href = target.getAttribute('href');
        if (href) {
          const anchor = document.querySelector(href) as HTMLElement;
          if (anchor) {
            anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    });
  }

  function closeCityDropdown(): void {
    cityDropdown.style.display = 'none';
    citySelector.classList.remove('city-selector--open');
  }

  function filterCities(keyword: string): void {
    const groups = cityListEl.querySelectorAll('.city-group');
    groups.forEach(group => {
      const items = group.querySelectorAll('.city-item') as NodeListOf<HTMLElement>;
      let hasVisible = false;
      items.forEach(item => {
        const name = item.getAttribute('data-city') || '';
        const match = !keyword || name.includes(keyword);
        item.classList.toggle('city-item--hidden', !match);
        if (match) hasVisible = true;
      });
      (group as HTMLElement).classList.toggle('city-group--hidden', !hasVisible);
    });
  }

  /** 切城后用最近一句重新解析，收敛到新城的 POI 检索域 */
  async function reparseForCity(): Promise<void> {
    const last = chatHistory[chatHistory.length - 1];
    if (!last) return;
    addBubble('assistant', `<p>已切换到${currentCity}，正在为你重新识别…</p>`);
    const resp = await apiPost('/api/parse', { text: last, city: currentCity });
    if (!resp.ok) return;
    const result = resp.data as { card?: OrderDraft };
    if (result.card?.origin) draft.origin = result.card.origin;
    if (result.card?.destination) draft.destination = result.card.destination;
    if (draft.origin?.name && draft.destination?.name) showOrderCard();
  }

  /** 从 BFF 动态加载城市列表 → 替换 SSR 的静态列表 */
  async function loadCitiesFromAPI(): Promise<void> {
    try {
      const resp = await apiGet('/api/cities');
      if (!resp.ok || !resp.data.cities) return; // API 失败则保留 SSR 静态列表

      const groups = resp.data.cities as { letter: string; cities: { name: string; id: string }[] }[];
      coveredCities = new Set(); // 服务范围校验来源
      groups.forEach(g => g.cities.forEach(c => coveredCities.add(c.name)));
      const indexEl = $('cityIndex') as HTMLElement;

      // 重建字母索引
      indexEl.innerHTML = groups.map(g =>
        `<a class="city-dropdown__letter" href="#city-${g.letter}">${g.letter}</a>`
      ).join('');

      // 重建城市列表
      cityListEl.innerHTML = groups.map(g => `
        <div class="city-group" id="city-${g.letter}">
          <div class="city-group__letter">${g.letter}</div>
          <div class="city-group__items">
            ${g.cities.map(c => `<button class="city-item" data-city="${c.name}">${c.name}</button>`).join('')}
          </div>
        </div>
      `).join('');
    } catch {
      // 静默降级：保留 SSR 渲染的静态城市列表
    }
  }

  // ── 启动 ──
  function init(): void {
    requestGPS();
    initReturningUser();
    bindEvents();
    // 异步加载真实城市列表（不阻塞首屏）
    loadCitiesFromAPI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
