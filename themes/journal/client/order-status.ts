/**
 * order-status.ts — 订单状态时间线页交互
 *
 * 职责：
 * 1. 轮询 GET /api/order/:token 刷新状态
 * 2. 渲染时间线节点
 * 3. 取消订单交互
 * 4. 退避策略（5s → 10s → 15s）
 */
(function () {
  'use strict';

  const $ = (id: string) => document.getElementById(id);
  const timeline = $('timeline') as HTMLElement;
  const cancelBtn = $('cancelBtn') as HTMLButtonElement;
  const contactDriver = $('contactDriver') as HTMLElement;
  const maskedPhone = $('maskedPhone') as HTMLElement;
  const routeOrigin = $('routeOrigin') as HTMLElement;
  const routeDest = $('routeDest') as HTMLElement;
  const terminalPanel = $('terminalPanel') as HTMLElement;
  const terminalMsg = $('terminalMsg') as HTMLElement;
  const actionsSection = $('actions') as HTMLElement;

  // 从 SSR 注入的 token
  const queryToken: string = (window as unknown as { __QUERY_TOKEN__: string }).__QUERY_TOKEN__;

  if (!queryToken) {
    timeline.innerHTML = '<p class="status-timeline__error">无效的订单链接</p>';
    return;
  }

  // ── 状态标签映射 ──
  const STATUS_LABELS: Record<string, { label: string; icon: string }> = {
    accepted: { label: '订单已受理', icon: '📋' },
    confirmed: { label: '人工已确认', icon: '✅' },
    calling_driver: { label: '正在呼叫司机', icon: '📡' },
    driver_assigned: { label: '司机已接单', icon: '🚗' },
    no_driver: { label: '暂无可用司机', icon: '⚠️' },
    out_of_range: { label: '超出服务范围', icon: '📍' },
    cancelled: { label: '订单已取消', icon: '❌' },
  };

  const TERMINAL_STATUSES = new Set(['driver_assigned', 'no_driver', 'out_of_range', 'cancelled']);
  const CANCELLABLE = new Set(['accepted', 'confirmed', 'calling_driver']);

  // ── 退避策略 ──
  let pollCount = 0;
  function getPollInterval(): number {
    if (pollCount < 12) return 5000;   // 前 1 分钟：5 秒
    if (pollCount < 24) return 10000;  // 1-3 分钟：10 秒
    return 15000;                       // 之后：15 秒
  }

  // ── 渲染时间线 ──
  interface TimelineEvent {
    status: string;
    at: number;
  }

  function renderTimeline(events: TimelineEvent[], currentStatus: string): void {
    timeline.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'status-timeline__list';

    events.forEach((evt, i) => {
      const li = document.createElement('li');
      const isLast = i === events.length - 1;
      const meta = STATUS_LABELS[evt.status] || { label: evt.status, icon: '•' };
      const time = new Date(evt.at);
      const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

      li.className = `status-timeline__item${isLast ? ' status-timeline__item--active' : ''}`;
      li.innerHTML = `
        <span class="status-timeline__icon">${meta.icon}</span>
        <div class="status-timeline__content">
          <span class="status-timeline__label">${meta.label}</span>
          <span class="status-timeline__time">${timeStr}</span>
        </div>
      `;
      ul.appendChild(li);
    });

    timeline.appendChild(ul);

    // 控制取消按钮和司机联系区域
    if (CANCELLABLE.has(currentStatus)) {
      cancelBtn.style.display = 'block';
      contactDriver.style.display = 'none';
    } else if (currentStatus === 'driver_assigned') {
      cancelBtn.style.display = 'none';
      contactDriver.style.display = 'block';
    } else {
      cancelBtn.style.display = 'none';
      contactDriver.style.display = 'none';
    }

    // 终态处理
    if (TERMINAL_STATUSES.has(currentStatus)) {
      if (currentStatus === 'no_driver') {
        terminalMsg.textContent = '很抱歉，当前暂无可用司机。请稍后重试或拨打 95139。';
        terminalPanel.style.display = 'block';
      } else if (currentStatus === 'out_of_range') {
        terminalMsg.textContent = '很抱歉，目的地超出当前服务范围。';
        terminalPanel.style.display = 'block';
      } else if (currentStatus === 'cancelled') {
        terminalMsg.textContent = '订单已取消。';
        terminalPanel.style.display = 'block';
        actionsSection.style.display = 'none';
      } else if (currentStatus === 'driver_assigned') {
        // 司机已接单不是终态（用户需要等待服务），继续轮询但降低频率
      }
    }
  }

  // ── 轮询 ──
  let pollTimer: ReturnType<typeof setTimeout> | null = null;

  async function poll(): Promise<void> {
    try {
      const resp = await fetch(`/api/order/${queryToken}`);
      if (!resp.ok) {
        if (resp.status === 401) {
          timeline.innerHTML = '<p class="status-timeline__error">订单链接已失效，请重新叫车</p>';
          return;
        }
        schedulePoll();
        return;
      }

      const data = await resp.json();
      const { status, timeline: events, origin, destination, maskedPhone: phone } = data;

      // 渲染数据
      maskedPhone.textContent = `司机将联系尾号 ${phone?.slice(-4) || '****'}`;
      routeOrigin.textContent = origin?.name || '—';
      routeDest.textContent = destination?.name || '—';
      renderTimeline(events, status);

      // 非终态继续轮询（driver_assigned 也继续，但低频）
      if (!TERMINAL_STATUSES.has(status) || status === 'driver_assigned') {
        pollCount++;
        schedulePoll();
      }
    } catch {
      schedulePoll();
    }
  }

  function schedulePoll(): void {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = setTimeout(poll, getPollInterval());
  }

  // ── 取消订单 ──
  cancelBtn.addEventListener('click', async () => {
    if (!confirm('确定取消订单吗？')) return;
    cancelBtn.disabled = true;
    cancelBtn.textContent = '取消中…';

    try {
      const resp = await fetch(`/api/order/${queryToken}/cancel`, { method: 'POST' });
      if (resp.ok) {
        // 立即刷新
        poll();
      } else {
        const data = await resp.json();
        alert(data.hint || '取消失败，请拨打 95139');
        cancelBtn.disabled = false;
        cancelBtn.textContent = '取消订单';
      }
    } catch {
      alert('网络异常，请重试');
      cancelBtn.disabled = false;
      cancelBtn.textContent = '取消订单';
    }
  });

  // ── 启动 ──
  poll();
})();
