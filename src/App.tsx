import { Fragment, useEffect, useMemo, useState } from "react";
import "./styles.css";

const project = {
  "sourceNo": 8,
  "id": "hxyfront-62006",
  "port": 62006,
  "title": "珠宝镶嵌宝石分拣",
  "domain": "珠宝镶嵌",
  "prompt": "我需要一个面向珠宝镶嵌工作室的宝石分拣前端系统，可以记录宝石编号、种类、形状、克拉重量、尺寸、净度、颜色、切工、镶嵌位置和分拣状态。页面需要有分拣批次、尺寸筛选、镶嵌位置示意图、缺陷备注和按订单查看的宝石清单。",
  "palette": [
    "#be123c",
    "#0f766e",
    "#a855f7"
  ],
  "metrics": [
    "分拣批次",
    "待镶嵌",
    "缺陷备注",
    "总克拉"
  ],
  "filters": [
    "圆形",
    "椭圆",
    "梨形",
    "祖母绿切"
  ],
  "fields": [
    "宝石编号",
    "种类",
    "形状",
    "克拉重量",
    "尺寸",
    "镶嵌位置"
  ],
  "records": [
    [
      "ST-2048",
      "蓝宝石",
      "椭圆6x4mm",
      "主石位"
    ],
    [
      "ST-2061",
      "钻石",
      "圆形0.08ct",
      "围石A组"
    ],
    [
      "ST-2099",
      "祖母绿",
      "内含物明显",
      "需客户确认"
    ]
  ]
};

interface Gemstone {
  id: string;
  type: string;
  shape: string;
  carat: number;
  sizeMm: number;
  clarity: string;
  color: string;
  cut: string;
  batch: string;
}

interface Order {
  id: string;
  customer: string;
  item: string;
  positions: string[];
}

interface Assignment {
  orderId: string;
  positionId: string;
  gemId: string;
  batch: string;
  defectNote: string;
  assignedAt: string;
}

interface ConflictHint {
  orderId: string;
  positionId: string;
  batch: string;
  count: number;
  occupiedBy: string;
  at: string;
}

interface SizeRange {
  id: string;
  label: string;
  min: number;
  max: number;
}

const SIZE_RANGES: SizeRange[] = [
  { id: "xs", label: "≤2.0mm 配石", min: 0, max: 2 },
  { id: "sm", label: "2.1–3.5mm 副石", min: 2.1, max: 3.5 },
  { id: "md", label: "3.6–5.0mm 主石", min: 3.6, max: 5 },
  { id: "lg", label: "≥5.1mm 收藏级", min: 5.1, max: 99 },
];

const GEMSTONES: Gemstone[] = [
  { id: "ST-2048", type: "蓝宝石", shape: "椭圆", carat: 0.62, sizeMm: 4.0, clarity: "VS", color: "皇家蓝", cut: "明亮式", batch: "B-0918" },
  { id: "ST-2049", type: "蓝宝石", shape: "椭圆", carat: 0.58, sizeMm: 3.9, clarity: "VS", color: "皇家蓝", cut: "明亮式", batch: "B-0918" },
  { id: "ST-2050", type: "蓝宝石", shape: "椭圆", carat: 0.66, sizeMm: 4.1, clarity: "SI", color: "矢车菊", cut: "明亮式", batch: "B-0918" },
  { id: "ST-2055", type: "蓝宝石", shape: "圆形", carat: 0.5, sizeMm: 3.7, clarity: "VS", color: "皇家蓝", cut: "圆明亮", batch: "B-0918" },
  { id: "ST-2061", type: "钻石", shape: "圆形", carat: 0.08, sizeMm: 1.8, clarity: "VVS", color: "D-E", cut: "八心八箭", batch: "B-0921" },
  { id: "ST-2062", type: "钻石", shape: "圆形", carat: 0.07, sizeMm: 1.7, clarity: "VVS", color: "D-E", cut: "八心八箭", batch: "B-0921" },
  { id: "ST-2063", type: "钻石", shape: "圆形", carat: 0.09, sizeMm: 1.9, clarity: "VS", color: "F-G", cut: "八心八箭", batch: "B-0921" },
  { id: "ST-2064", type: "钻石", shape: "圆形", carat: 0.06, sizeMm: 1.6, clarity: "VVS", color: "D-E", cut: "八心八箭", batch: "B-0921" },
  { id: "ST-2099", type: "祖母绿", shape: "祖母绿切", carat: 1.1, sizeMm: 5.2, clarity: "内含物明显", color: "木佐绿", cut: "阶梯式", batch: "B-0924" },
  { id: "ST-2100", type: "祖母绿", shape: "祖母绿切", carat: 1.24, sizeMm: 5.5, clarity: "微油", color: "木佐绿", cut: "阶梯式", batch: "B-0924" },
  { id: "ST-2101", type: "祖母绿", shape: "椭圆", carat: 0.98, sizeMm: 5.1, clarity: "内含物明显", color: "浓绿", cut: "混合式", batch: "B-0924" },
  { id: "ST-2110", type: "红宝石", shape: "梨形", carat: 0.72, sizeMm: 4.6, clarity: "VS", color: "鸽血红", cut: "混合式", batch: "B-0926" },
  { id: "ST-2111", type: "红宝石", shape: "圆形", carat: 0.15, sizeMm: 2.4, clarity: "SI", color: "鸽血红", cut: "圆明亮", batch: "B-0926" },
  { id: "ST-2112", type: "红宝石", shape: "圆形", carat: 0.18, sizeMm: 2.6, clarity: "SI", color: "深红", cut: "圆明亮", batch: "B-0926" },
];

const ORDERS: Order[] = [
  { id: "ORD-3301", customer: "林女士", item: "钻戒", positions: ["主石位", "围石A组", "戒臂左", "戒臂右"] },
  { id: "ORD-3302", customer: "陈先生", item: "耳坠", positions: ["主石位", "副石位", "耳钩位"] },
  { id: "ORD-3303", customer: "王太太", item: "吊坠", positions: ["主石位", "花头一组", "花头二组", "底托位"] },
];

const SEED_ASSIGNMENTS: Assignment[] = [
  {
    orderId: "ORD-3301",
    positionId: "主石位",
    gemId: "ST-2048",
    batch: "B-0918",
    defectNote: "台面轻微划痕，已告知客户",
    assignedAt: "2026-09-25 10:24:00",
  },
];

const STORAGE_KEY = "hxyfront-62006:workbench-v1";

interface DraftState {
  sizeRangeId: string;
  customMin: string;
  customMax: string;
  checkedIds: string[];
  orderId: string;
  positionId: string;
  defectNote: string;
}

interface PersistedState {
  assignments: Assignment[];
  conflict: ConflictHint | null;
  draft: DraftState;
}

const EMPTY_DRAFT: DraftState = {
  sizeRangeId: "",
  customMin: "",
  customMax: "",
  checkedIds: [],
  orderId: "",
  positionId: "",
  defectNote: "",
};

function loadPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      assignments: Array.isArray(parsed.assignments) ? parsed.assignments : SEED_ASSIGNMENTS,
      conflict: parsed.conflict ?? null,
      draft: { ...EMPTY_DRAFT, ...(parsed.draft ?? {}) },
    };
  } catch {
    return null;
  }
}

function nowText(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const persisted = loadPersisted();

function App() {
  const [assignments, setAssignments] = useState<Assignment[]>(persisted?.assignments ?? SEED_ASSIGNMENTS);
  const [conflict, setConflict] = useState<ConflictHint | null>(persisted?.conflict ?? null);
  const [sizeRangeId, setSizeRangeId] = useState(persisted?.draft.sizeRangeId ?? "");
  const [customMin, setCustomMin] = useState(persisted?.draft.customMin ?? "");
  const [customMax, setCustomMax] = useState(persisted?.draft.customMax ?? "");
  const [checkedIds, setCheckedIds] = useState<string[]>(persisted?.draft.checkedIds ?? []);
  const [orderId, setOrderId] = useState(persisted?.draft.orderId ?? "");
  const [positionId, setPositionId] = useState(persisted?.draft.positionId ?? "");
  const [defectNote, setDefectNote] = useState(persisted?.draft.defectNote ?? "");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const state: PersistedState = {
      assignments,
      conflict,
      draft: { sizeRangeId, customMin, customMax, checkedIds, orderId, positionId, defectNote },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [assignments, conflict, sizeRangeId, customMin, customMax, checkedIds, orderId, positionId, defectNote]);

  const assignedGemIds = useMemo(() => new Set(assignments.map((a) => a.gemId)), [assignments]);
  const pendingGems = useMemo(() => GEMSTONES.filter((g) => !assignedGemIds.has(g.id)), [assignedGemIds]);

  const activeRange = useMemo<SizeRange | null>(() => {
    if (customMin !== "" || customMax !== "") {
      const min = customMin === "" ? 0 : Number(customMin);
      const max = customMax === "" ? Number.POSITIVE_INFINITY : Number(customMax);
      return { id: "custom", label: `自定义 ${customMin || "0"}–${customMax || "∞"}mm`, min, max };
    }
    return SIZE_RANGES.find((r) => r.id === sizeRangeId) ?? null;
  }, [sizeRangeId, customMin, customMax]);

  const filteredGems = useMemo(
    () => (activeRange ? pendingGems.filter((g) => g.sizeMm >= activeRange.min && g.sizeMm <= activeRange.max) : []),
    [activeRange, pendingGems]
  );

  const batchGroups = useMemo(() => {
    const map = new Map<string, Gemstone[]>();
    for (const gem of filteredGems) {
      const list = map.get(gem.batch) ?? [];
      list.push(gem);
      map.set(gem.batch, list);
    }
    return [...map.entries()];
  }, [filteredGems]);

  const checkedGems = useMemo(() => pendingGems.filter((g) => checkedIds.includes(g.id)), [pendingGems, checkedIds]);
  const activeBatch = checkedGems[0]?.batch ?? "";
  const currentOrder = ORDERS.find((o) => o.id === orderId) ?? null;

  const orderSummaries = useMemo(
    () =>
      ORDERS.map((order) => {
        const orderAssignments = assignments.filter((a) => a.orderId === order.id);
        const occupied = new Set(orderAssignments.map((a) => a.positionId));
        return {
          order,
          assignedCount: orderAssignments.length,
          pendingCount: order.positions.filter((p) => !occupied.has(p)).length,
          occupied,
        };
      }),
    [assignments]
  );

  const metrics = [
    new Set(GEMSTONES.map((g) => g.batch)).size,
    pendingGems.length,
    assignments.filter((a) => a.defectNote).length,
    GEMSTONES.reduce((sum, g) => sum + g.carat, 0).toFixed(2),
  ];

  function pickRange(id: string) {
    setSizeRangeId((prev) => (prev === id ? "" : id));
    setCustomMin("");
    setCustomMax("");
    setCheckedIds([]);
    setError("");
  }

  function onCustomMin(value: string) {
    setCustomMin(value);
    setSizeRangeId("");
    setCheckedIds([]);
  }

  function onCustomMax(value: string) {
    setCustomMax(value);
    setSizeRangeId("");
    setCheckedIds([]);
  }

  function toggleGem(gem: Gemstone) {
    setNotice("");
    if (checkedIds.includes(gem.id)) {
      setCheckedIds(checkedIds.filter((id) => id !== gem.id));
      setError("");
      return;
    }
    if (activeBatch && gem.batch !== activeBatch) {
      setError(`同一批次才能一起分配：已选批次 ${activeBatch}，${gem.id} 属于批次 ${gem.batch}`);
      return;
    }
    setError("");
    setCheckedIds([...checkedIds, gem.id]);
  }

  function selectBatch(list: Gemstone[]) {
    setCheckedIds(list.map((g) => g.id));
    setError("");
    setNotice("");
  }

  function handleSubmit() {
    setNotice("");
    if (!activeRange) {
      setError("请先选择尺寸范围，再勾选宝石");
      return;
    }
    if (checkedGems.length === 0) {
      setError("请勾选同一批次中待分配的宝石");
      return;
    }
    if (!orderId) {
      setError("请选择要分配的订单");
      return;
    }
    if (!positionId) {
      setError("请指定订单内的镶嵌位");
      return;
    }

    const holder = assignments.find((a) => a.orderId === orderId && a.positionId === positionId);
    if (holder) {
      setConflict({
        orderId,
        positionId,
        batch: activeBatch,
        count: checkedGems.length,
        occupiedBy: holder.gemId,
        at: nowText(),
      });
      setError("");
      return;
    }

    const at = nowText();
    const note = defectNote.trim();
    const records: Assignment[] = checkedGems.map((g) => ({
      orderId,
      positionId,
      gemId: g.id,
      batch: g.batch,
      defectNote: note,
      assignedAt: at,
    }));
    setAssignments((prev) => [...prev, ...records]);
    setCheckedIds([]);
    setDefectNote("");
    setConflict(null);
    setError("");
    setNotice(`已写入 ${records.length} 条分配记录：${orderId} · ${positionId}（批次 ${activeBatch}）`);
  }

  function exportSummary() {
    const lines = [
      `珠宝镶嵌分配摘要 ${nowText()}`,
      "",
      ...orderSummaries.map(
        (s) => `${s.order.id}（${s.order.customer}·${s.order.item}）：已分配 ${s.assignedCount} 颗，待镶嵌 ${s.pendingCount} 个位置`
      ),
      "",
      "分配明细：",
      ...assignments.map(
        (a) => `- ${a.gemId} → ${a.orderId}/${a.positionId}（批次 ${a.batch}，缺陷备注：${a.defectNote || "无"}，${a.assignedAt}）`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "镶嵌分配摘要.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app">
      <section className="hero">
        <p>{project.id} · 源提示词{project.sourceNo} · Port {project.port}</p>
        <h1>{project.title}</h1>
        <span>{project.prompt}</span>
      </section>

      <section className="metrics">
        {project.metrics.map((metric: string, index: number) => (
          <article key={metric}>
            <small>{metric}</small>
            <strong>{metrics[index]}</strong>
          </article>
        ))}
      </section>

      <section className="workspace">
        <aside className="panel">
          <h2>尺寸范围筛选</h2>
          <div className="chips">
            {SIZE_RANGES.map((range) => (
              <button
                key={range.id}
                className={activeRange?.id === range.id ? "chip active" : "chip"}
                onClick={() => pickRange(range.id)}
              >
                {range.label}
              </button>
            ))}
          </div>
          <div className="range-inputs">
            <label>
              <span>最小尺寸 (mm)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="如 2.1"
                value={customMin}
                onChange={(e) => onCustomMin(e.target.value)}
              />
            </label>
            <label>
              <span>最大尺寸 (mm)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="如 3.5"
                value={customMax}
                onChange={(e) => onCustomMax(e.target.value)}
              />
            </label>
          </div>
          <p className="hint">
            {activeRange ? `当前范围：${activeRange.label}，命中 ${filteredGems.length} 颗待镶嵌宝石` : "尚未选择尺寸范围"}
          </p>
          <div className="side-note">
            <h3>同批次勾选</h3>
            <p>
              {checkedGems.length > 0
                ? `已选 ${checkedGems.length} 颗 · 批次 ${activeBatch}`
                : "勾选时仅允许同一分拣批次"}
            </p>
          </div>
        </aside>

        <section className="panel form-panel">
          <div className="heading">
            <div>
              <p>独占分配流程</p>
              <h2>待镶嵌宝石</h2>
            </div>
            <button className="primary" onClick={handleSubmit}>写入分配记录</button>
          </div>

          {conflict && (
            <div className="banner conflict" role="alert">
              <div>
                <strong>镶嵌位冲突</strong>
                <p>
                  订单 {conflict.orderId} 的「{conflict.positionId}」已被 {conflict.occupiedBy} 占用，
                  批次 {conflict.batch} 共 {conflict.count} 颗宝石均未写入分配记录。
                </p>
                <small>{conflict.at}</small>
              </div>
              <button onClick={() => setConflict(null)}>知道了</button>
            </div>
          )}
          {error && <div className="banner error" role="alert">{error}</div>}
          {notice && <div className="banner ok" role="status">{notice}</div>}

          <div className="table-wrap">
            <table className="gem-table">
              <thead>
                <tr>
                  <th>选</th>
                  <th>宝石编号</th>
                  <th>种类</th>
                  <th>形状</th>
                  <th>尺寸mm</th>
                  <th>克拉</th>
                  <th>净度</th>
                  <th>颜色</th>
                  <th>切工</th>
                </tr>
              </thead>
              <tbody>
                {batchGroups.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty-cell">
                      {activeRange ? "该尺寸范围内暂无待镶嵌宝石" : "请先在左侧选择尺寸范围"}
                    </td>
                  </tr>
                )}
                {batchGroups.map(([batch, list]) => (
                  <Fragment key={batch}>
                    <tr className="batch-row">
                      <td colSpan={9}>
                        <span>批次 {batch} · {list.length} 颗</span>
                        <button className="mini" onClick={() => selectBatch(list)}>全选本批次</button>
                      </td>
                    </tr>
                    {list.map((gem) => (
                      <tr key={gem.id} className={checkedIds.includes(gem.id) ? "checked" : ""}>
                        <td>
                          <input
                            type="checkbox"
                            checked={checkedIds.includes(gem.id)}
                            onChange={() => toggleGem(gem)}
                            aria-label={`选择 ${gem.id}`}
                          />
                        </td>
                        <td>{gem.id}</td>
                        <td>{gem.type}</td>
                        <td>{gem.shape}</td>
                        <td>{gem.sizeMm.toFixed(1)}</td>
                        <td>{gem.carat.toFixed(2)}</td>
                        <td>{gem.clarity}</td>
                        <td>{gem.color}</td>
                        <td>{gem.cut}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="assign-grid">
            <label>
              <span>分配订单</span>
              <select
                value={orderId}
                onChange={(e) => {
                  setOrderId(e.target.value);
                  setPositionId("");
                  setError("");
                }}
              >
                <option value="">请选择订单</option>
                {ORDERS.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.id} · {order.customer}（{order.item}）
                  </option>
                ))}
              </select>
            </label>
            <div className="position-field">
              <span>镶嵌位（已占用位仍可点选核对）</span>
              <div className="positions">
                {!currentOrder && <p className="hint">请先选择订单</p>}
                {currentOrder?.positions.map((pid) => {
                  const holder = assignments.find((a) => a.orderId === orderId && a.positionId === pid);
                  const cls = ["position", positionId === pid ? "selected" : "", holder ? "occupied" : ""]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <button key={pid} className={cls} onClick={() => { setPositionId(pid); setError(""); }}>
                      <b>{pid}</b>
                      <small>{holder ? `已占用 · ${holder.gemId}` : "空闲"}</small>
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="note-field">
              <span>缺陷备注</span>
              <textarea
                rows={2}
                placeholder="如：台面轻微划痕、内含物位置、需客户确认等"
                value={defectNote}
                onChange={(e) => setDefectNote(e.target.value)}
              />
            </label>
          </div>
        </section>
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>订单清单</p>
            <h2>按订单汇总</h2>
          </div>
        </div>
        <div className="orders">
          {orderSummaries.map(({ order, assignedCount, pendingCount, occupied }) => (
            <article className="order-card" key={order.id}>
              <header>
                <h3>{order.id} · {order.customer}</h3>
                <p>{order.item}</p>
              </header>
              <div className="order-stats">
                <span><b>{assignedCount}</b> 已分配</span>
                <span><b>{pendingCount}</b> 待镶嵌</span>
              </div>
              <div className="order-positions">
                {order.positions.map((pid) => (
                  <span key={pid} className={occupied.has(pid) ? "tag occupied" : "tag"}>
                    {pid}{occupied.has(pid) ? " ✓" : ""}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>分配记录</p>
            <h2>已写入的分配（{assignments.length} 条）</h2>
          </div>
          <button onClick={exportSummary}>导出摘要</button>
        </div>
        <div className="records">
          {assignments.length === 0 && <p className="hint">暂无分配记录</p>}
          {assignments.map((a, index) => (
            <article key={`${a.gemId}-${a.assignedAt}`}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <div>
                <h3>{a.gemId} → {a.orderId} · {a.positionId}</h3>
                <p>批次 {a.batch} · 缺陷备注：{a.defectNote || "无"} · {a.assignedAt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
