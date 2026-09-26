import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import {
  Allocation,
  Draft,
  GEMS,
  ORDERS,
  Order,
  SIZE_RANGES,
  emptyDraft,
  inRange,
  loadAllocations,
  loadDraft,
  nextBatchId,
  saveAllocations,
  saveDraft,
  seedAllocations,
} from "./data";

type Feedback =
  | { kind: "success"; text: string }
  | { kind: "error"; text: string }
  | null;

type Conflict = {
  orderCode: string;
  orderLabel: string;
  positionName: string;
  batchId: string;
  gemText: string;
  time: string;
} | null;

const GEM_BY_CODE = new Map(GEMS.map((gem) => [gem.code, gem]));

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function orderLabel(order: Order): string {
  return `${order.code} · ${order.piece}（${order.customer}）`;
}

function App() {
  const [allocations, setAllocations] = useState<Allocation[]>(loadAllocations);
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [conflict, setConflict] = useState<Conflict>(null);
  const [diagramHint, setDiagramHint] = useState<string | null>(null);

  // 分配记录与草稿都落到本地，关掉页面再打开可以接着处理
  useEffect(() => saveAllocations(allocations), [allocations]);
  useEffect(() => saveDraft(draft), [draft]);

  const allocatedCodes = useMemo(() => {
    const codes = new Set<string>();
    allocations.forEach((item) => item.gemCodes.forEach((code) => codes.add(code)));
    return codes;
  }, [allocations]);

  const occupiedByKey = useMemo(() => {
    const map = new Map<string, Allocation>();
    allocations.forEach((item) => map.set(`${item.orderCode}:${item.positionId}`, item));
    return map;
  }, [allocations]);

  const selectedOrder =
    ORDERS.find((order) => order.code === draft.orderCode) ?? ORDERS[0];

  const selectedRange = SIZE_RANGES.find((range) => range.id === draft.rangeId);

  // 第一步：按尺寸范围挑出待镶嵌宝石（已分配的不再出现）
  const candidates = useMemo(
    () =>
      GEMS.filter(
        (gem) => !allocatedCodes.has(gem.code) && inRange(gem, selectedRange),
      ),
    [allocatedCodes, selectedRange],
  );
  const candidateCodes = candidates.map((gem) => gem.code);

  // 候选列表变化（换尺寸 / 已被分走）时，剔除勾选项中失效的宝石
  useEffect(() => {
    setDraft((prev) => {
      const valid = new Set(candidateCodes);
      const next = prev.selected.filter((code) => valid.has(code));
      return next.length === prev.selected.length ? prev : { ...prev, selected: next };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateCodes.join("|")]);

  const chosenPosition = selectedOrder.positions.find(
    (pos) => pos.id === draft.positionId,
  );
  const occupying = chosenPosition
    ? occupiedByKey.get(`${selectedOrder.code}:${chosenPosition.id}`)
    : undefined;

  const totalAllocatedCarat = useMemo(
    () =>
      allocations.reduce(
        (sum, item) =>
          sum +
          item.gemCodes.reduce(
            (inner, code) => inner + (GEM_BY_CODE.get(code)?.carat ?? 0),
            0,
          ),
        0,
      ),
    [allocations],
  );

  const defectCount = GEMS.filter((gem) => gem.defect).length;

  function pickRange(rangeId: string) {
    setFeedback(null);
    // 切换尺寸范围后原勾选属于另一批，清空避免跨批次误写
    setDraft((prev) => ({ ...prev, rangeId, selected: [] }));
  }

  function pickOrder(orderCode: string) {
    setFeedback(null);
    setConflict(null);
    setDiagramHint(null);
    setDraft((prev) => ({ ...prev, orderCode, positionId: "" }));
  }

  function pickPosition(positionId: string) {
    const order = ORDERS.find((o) => o.code === draft.orderCode) ?? ORDERS[0];
    const pos = order.positions.find((p) => p.id === positionId);
    const occupied = occupiedByKey.get(`${order.code}:${positionId}`);
    setFeedback(null);
    if (occupied && pos) {
      setDiagramHint(
        `「${pos.name}」已被批次 ${occupied.batchId} 占用（${occupied.gemCodes.length} 颗），再提交本批会被整批拒绝。`,
      );
    } else {
      setDiagramHint(null);
    }
    setDraft((prev) => ({ ...prev, positionId }));
  }

  function toggleGem(code: string) {
    setFeedback(null);
    setDraft((prev) => ({
      ...prev,
      selected: prev.selected.includes(code)
        ? prev.selected.filter((item) => item !== code)
        : [...prev.selected, code],
    }));
  }

  function toggleAll(checked: boolean) {
    setFeedback(null);
    setDraft((prev) => ({
      ...prev,
      selected: checked ? candidateCodes : [],
    }));
  }

  function submitAllocation() {
    // 尺寸未选不能提交
    if (!draft.rangeId) {
      setFeedback({ kind: "error", text: "请先在第一步选择尺寸范围，再勾选批次宝石。" });
      return;
    }
    // 批次为空不能提交
    if (draft.selected.length === 0) {
      setFeedback({ kind: "error", text: "请至少勾选一颗宝石组成同一批次。" });
      return;
    }
    // 镶嵌位为空不能提交
    if (!draft.positionId || !chosenPosition) {
      setFeedback({ kind: "error", text: "请在订单示意图或下拉框中指定镶嵌位。" });
      return;
    }

    // 独占校验：该位置已被占用时，这批宝石全部不写入分配记录
    if (occupying) {
      const occupiedGem = occupying.gemCodes
        .map((code) => GEM_BY_CODE.get(code)?.code ?? code)
        .join("、");
      setConflict({
        orderCode: selectedOrder.code,
        orderLabel: orderLabel(selectedOrder),
        positionName: chosenPosition.name,
        batchId: occupying.batchId,
        gemText: occupiedGem,
        time: fmtTime(occupying.createdAt),
      });
      setFeedback({
        kind: "error",
        text: `独占分配失败：${selectedOrder.code} 的「${chosenPosition.name}」已被 ${occupying.batchId} 占用，本批 ${draft.selected.length} 颗宝石均未写入。`,
      });
      return;
    }

    // 位置容量校验
    if (draft.selected.length > chosenPosition.need) {
      setFeedback({
        kind: "error",
        text: `「${chosenPosition.name}」只需 ${chosenPosition.need} 颗，当前批次勾选了 ${draft.selected.length} 颗，请调整后再提交。`,
      });
      return;
    }

    const batchId = nextBatchId(allocations);
    const record: Allocation = {
      batchId,
      orderCode: selectedOrder.code,
      positionId: chosenPosition.id,
      gemCodes: draft.selected,
      defectNote: draft.defectNote.trim(),
      createdAt: new Date().toISOString(),
    };
    setAllocations((prev) => [...prev, record]);
    setConflict(null);
    setDiagramHint(null);
    setFeedback({
      kind: "success",
      text: `批次 ${batchId} 已独占写入：${selectedOrder.code}「${chosenPosition.name}」分配 ${record.gemCodes.length} 颗。`,
    });
    // 保留尺寸范围与订单，方便继续下一批；清空勾选、位置与备注
    setDraft((prev) => ({
      ...prev,
      positionId: "",
      defectNote: "",
      selected: [],
    }));
  }

  function resetDemo() {
    setAllocations(seedAllocations());
    setDraft(emptyDraft);
    setConflict(null);
    setFeedback({ kind: "success", text: "已恢复演示数据：PO-2601 主石位、围石 A 组保持占用，可重试冲突。" });
    setDiagramHint(null);
  }

  const allCandidatesChecked =
    candidates.length > 0 && draft.selected.length === candidates.length;

  // 镶嵌位示意图：主石居中，其余位置环绕
  const mainPos =
    selectedOrder.positions.find((pos) => pos.id === "main") ??
    selectedOrder.positions[0];
  const satellites = selectedOrder.positions.filter((pos) => pos.id !== mainPos?.id);

  return (
    <main className="app">
      <section className="hero hero-compact">
        <p>hxyfront-62006 · 珠宝镶嵌 · 独占分配工作台</p>
        <h1>宝石分拣与镶嵌位独占分配</h1>
        <span>
          按尺寸范围筛出待镶嵌宝石并勾选同一批次，指定订单镶嵌位、登记缺陷备注后整批写入；
          镶嵌位已被占用时整批拒绝，绝不出现同一位置两颗石头。
        </span>
      </section>

      <section className="metrics">
        <article>
          <small>分拣批次</small>
          <strong>{allocations.length}</strong>
        </article>
        <article>
          <small>待镶嵌宝石</small>
          <strong>{GEMS.length - allocatedCodes.size}</strong>
        </article>
        <article>
          <small>缺陷关注</small>
          <strong>{defectCount}</strong>
        </article>
        <article>
          <small>已分配总克拉</small>
          <strong>{totalAllocatedCarat.toFixed(2)}</strong>
        </article>
      </section>

      {conflict && (
        <section className="alert alert-conflict" role="alert">
          <div className="alert-mark">!</div>
          <div className="alert-body">
            <h3>镶嵌位冲突 · 本批宝石未写入任何分配记录</h3>
            <p>
              当前订单 <b>{conflict.orderLabel}</b> 的镶嵌位{" "}
              <b>「{conflict.positionName}」</b> 已被批次{" "}
              <b>{conflict.batchId}</b> 占用（{conflict.time} 写入，含{" "}
              {conflict.gemText}）。
            </p>
            <p className="alert-tip">
              请改选该订单的空闲镶嵌位，或切换到其他订单后重新提交；勾选的宝石与备注已保留。
            </p>
          </div>
          <button
            className="alert-close"
            onClick={() => setConflict(null)}
            aria-label="关闭冲突提示"
          >
            ×
          </button>
        </section>
      )}

      <section className="workspace workspace-allocate">
        {/* 第一步：尺寸范围 + 批次勾选 */}
        <div className="panel">
          <div className="step-head">
            <span className="step-no">1</span>
            <div>
              <p>尺寸范围筛选</p>
              <h2>挑出待镶嵌宝石</h2>
            </div>
          </div>

          <div className="chips range-chips" role="radiogroup" aria-label="尺寸范围">
            {SIZE_RANGES.map((range) => (
              <button
                key={range.id}
                role="radio"
                aria-checked={draft.rangeId === range.id}
                className={draft.rangeId === range.id ? "chip-on" : ""}
                onClick={() => pickRange(range.id)}
                title={range.hint}
              >
                <b>{range.label}</b>
                <small>{range.hint}</small>
              </button>
            ))}
          </div>

          <div className="gem-pool">
            {!selectedRange ? (
              <p className="empty-hint">请先选择一个尺寸范围，再从候选中勾选同一批次。</p>
            ) : candidates.length === 0 ? (
              <p className="empty-hint">该尺寸范围已无待镶嵌宝石，换个范围看看。</p>
            ) : (
              <>
                <label className="pick-all">
                  <input
                    type="checkbox"
                    checked={allCandidatesChecked}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                  <span>
                    全选本批候选（{candidates.length} 颗，已勾 {draft.selected.length}）
                  </span>
                </label>
                <ul className="gem-list">
                  {candidates.map((gem) => {
                    const checked = draft.selected.includes(gem.code);
                    return (
                      <li key={gem.code} className={checked ? "gem-on" : ""}>
                        <label>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleGem(gem.code)}
                          />
                          <span className="gem-main">
                            <b>{gem.code}</b>
                            <em>
                              {gem.kind} · {gem.shape} · {gem.sizeMm}mm · {gem.carat}ct
                            </em>
                          </span>
                        </label>
                        {gem.defect && (
                          <span className="defect-flag" title={gem.defect}>
                            缺陷
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* 第二步：订单 + 镶嵌位 + 缺陷备注 + 提交 */}
        <div className="panel">
          <div className="step-head">
            <span className="step-no">2</span>
            <div>
              <p>独占分配</p>
              <h2>指定订单镶嵌位并写入批次</h2>
            </div>
          </div>

          <label className="field">
            <span>订单</span>
            <select
              value={draft.orderCode}
              onChange={(e) => pickOrder(e.target.value)}
            >
              {ORDERS.map((order) => (
                <option key={order.code} value={order.code}>
                  {orderLabel(order)}
                </option>
              ))}
            </select>
          </label>

          <div className="position-block">
            <div className="diagram" aria-label="镶嵌位示意图">
              {mainPos &&
                renderDot(mainPos, true, selectedOrder, occupiedByKey, draft, pickPosition)}
              {satellites.map((pos, i) => {
                const angle = -90 + (360 / satellites.length) * i;
                const rad = (angle * Math.PI) / 180;
                const style = {
                  left: `${50 + 40 * Math.cos(rad)}%`,
                  top: `${50 + 40 * Math.sin(rad)}%`,
                };
                return (
                  <div key={pos.id} style={style} className="orbit-dot-wrap">
                    {renderDot(pos, false, selectedOrder, occupiedByKey, draft, pickPosition)}
                  </div>
                );
              })}
            </div>

            <ul className="legend">
              {selectedOrder.positions.map((pos) => {
                const taken = occupiedByKey.get(`${selectedOrder.code}:${pos.id}`);
                const active = draft.positionId === pos.id;
                return (
                  <li key={pos.id}>
                    <button
                      className={[
                        "legend-item",
                        taken ? "taken" : "free",
                        active ? "active" : "",
                      ].join(" ")}
                      onClick={() => pickPosition(pos.id)}
                    >
                      <span className="legend-dot" />
                      <b>{pos.name}</b>
                      <em>需 {pos.need} 颗</em>
                      <small>{taken ? `已占用 · ${taken.batchId}` : "空闲"}</small>
                    </button>
                  </li>
                );
              })}
            </ul>

            <label className="field">
              <span>镶嵌位</span>
              <select
                value={draft.positionId}
                onChange={(e) => pickPosition(e.target.value)}
              >
                <option value="">请选择镶嵌位…</option>
                {selectedOrder.positions.map((pos) => {
                  const taken = occupiedByKey.get(`${selectedOrder.code}:${pos.id}`);
                  return (
                    <option key={pos.id} value={pos.id}>
                      {pos.name}（需 {pos.need} 颗）{taken ? " —— 已占用" : ""}
                    </option>
                  );
                })}
              </select>
            </label>

            {diagramHint && <p className="hint-warn">{diagramHint}</p>}

            <label className="field">
              <span>缺陷备注（整批共用，可留空）</span>
              <textarea
                rows={2}
                placeholder="例如：色差需配对 / 亭部缺口走包边镶口 / 待客户确认…"
                value={draft.defectNote}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, defectNote: e.target.value }))
                }
              />
            </label>

            {feedback && (
              <p className={`form-feedback ${feedback.kind}`}>{feedback.text}</p>
            )}

            <button className="primary submit-btn" onClick={submitAllocation}>
              独占提交本批（{draft.selected.length} 颗 → {chosenPosition?.name ?? "未选镶嵌位"}）
            </button>
            <p className="submit-note">
              提交前校验：尺寸范围已选、批次非空、镶嵌位已指定且未被占用；任一不满足都不会写入。
            </p>
          </div>
        </div>
      </section>

      {/* 订单清单：按订单汇总已分配与待镶嵌数量 */}
      <section className="panel">
        <div className="heading">
          <div>
            <p>订单清单</p>
            <h2>按订单汇总</h2>
          </div>
          <button className="ghost-btn" onClick={resetDemo}>
            恢复演示数据
          </button>
        </div>
        <div className="order-grid">
          {ORDERS.map((order) => {
            const orderAllocs = allocations.filter((a) => a.orderCode === order.code);
            const allocatedCount = orderAllocs.reduce(
              (sum, a) => sum + a.gemCodes.length,
              0,
            );
            const needTotal = order.positions.reduce((s, p) => s + p.need, 0);
            const pending = Math.max(0, needTotal - allocatedCount);
            return (
              <article key={order.code} className="order-card">
                <header>
                  <h3>{order.code}</h3>
                  <p>{order.piece}</p>
                  <small>客户：{order.customer}</small>
                </header>
                <div className="order-counts">
                  <div className="count-box done">
                    <strong>{allocatedCount}</strong>
                    <span>已分配（颗）</span>
                  </div>
                  <div className="count-box todo">
                    <strong>{pending}</strong>
                    <span>待镶嵌（颗）</span>
                  </div>
                  <div className="count-box">
                    <strong>{needTotal}</strong>
                    <span>共需（颗）</span>
                  </div>
                </div>
                <ul className="order-positions">
                  {order.positions.map((pos) => {
                    const taken = occupiedByKey.get(`${order.code}:${pos.id}`);
                    return (
                      <li key={pos.id} className={taken ? "is-taken" : "is-free"}>
                        <span className="pos-name">{pos.name}</span>
                        <span className="pos-need">需 {pos.need}</span>
                        <span className="pos-status">
                          {taken
                            ? `已占用 ${taken.batchId} · ${taken.gemCodes.length} 颗`
                            : `待镶嵌 ${pos.need} 颗`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {orderAllocs.length > 0 && (
                  <div className="order-batches">
                    {orderAllocs.map((a) => {
                      const pos = order.positions.find((p) => p.id === a.positionId);
                      return (
                        <div key={a.batchId} className="mini-batch">
                          <b>{a.batchId}</b>
                          <span>
                            {pos?.name ?? a.positionId} · {a.gemCodes.length} 颗
                          </span>
                          <em>{a.gemCodes.join("、")}</em>
                          {a.defectNote && <small>备注：{a.defectNote}</small>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* 分配记录 */}
      <section className="panel">
        <div className="heading">
          <div>
            <p>历史记录</p>
            <h2>分配批次明细</h2>
          </div>
        </div>
        <div className="records records-allocate">
          {[...allocations].reverse().map((item) => {
            const order = ORDERS.find((o) => o.code === item.orderCode);
            const pos = order?.positions.find((p) => p.id === item.positionId);
            return (
              <article key={item.batchId}>
                <b>{item.batchId.replace("PC-", "#")}</b>
                <div>
                  <h3>
                    {item.orderCode}「{pos?.name ?? item.positionId}」· {item.gemCodes.length} 颗
                    <time>{fmtTime(item.createdAt)}</time>
                  </h3>
                  <p>{item.gemCodes.join("、")}</p>
                  {item.defectNote && <p className="note-line">缺陷备注：{item.defectNote}</p>}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function renderDot(
  pos: { id: string; name: string; need: number },
  isMain: boolean,
  order: Order,
  occupiedByKey: Map<string, Allocation>,
  draft: Draft,
  pickPosition: (id: string) => void,
) {
  const taken = occupiedByKey.get(`${order.code}:${pos.id}`);
  const active = draft.positionId === pos.id;
  const cls = [
    "pos-dot",
    isMain ? "pos-main" : "pos-orbit",
    taken ? "dot-taken" : "dot-free",
    active ? "dot-active" : "",
  ].join(" ");
  return (
    <button
      className={cls}
      onClick={() => pickPosition(pos.id)}
      title={`${pos.name} · 需 ${pos.need} 颗${taken ? ` · 已占用 ${taken.batchId}` : " · 空闲"}`}
      aria-pressed={active}
    >
      {isMain ? "主" : pos.name.slice(0, 1)}
    </button>
  );
}

export default App;
