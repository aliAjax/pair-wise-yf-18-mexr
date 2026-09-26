// 宝石分拣工作台的数据模型、演示数据与本地持久化

export type Gem = {
  code: string; // 宝石编号
  kind: string; // 种类
  shape: "圆形" | "椭圆" | "梨形" | "祖母绿切";
  sizeMm: number; // 直径 / 长轴尺寸（mm）
  carat: number; // 克拉重量
  clarity: string; // 净度
  color: string; // 颜色
  cut: string; // 切工
  defect?: string; // 缺陷标记
};

export type OrderPosition = {
  id: string;
  name: string;
  need: number; // 该镶嵌位需要的宝石数
};

export type Order = {
  code: string;
  customer: string;
  piece: string;
  positions: OrderPosition[];
};

export type Allocation = {
  batchId: string; // 分拣批次号
  orderCode: string;
  positionId: string;
  gemCodes: string[];
  defectNote: string;
  createdAt: string;
};

export type SizeRange = {
  id: string;
  label: string;
  hint: string;
  min: number;
  max: number; // Infinity 表示无上界
};

export const SIZE_RANGES: SizeRange[] = [
  { id: "s", label: "0–2 mm", hint: "碎钻 / 群镶", min: 0, max: 2 },
  { id: "m", label: "2–5 mm", hint: "围石配石", min: 2, max: 5 },
  { id: "l", label: "5–8 mm", hint: "主配石", min: 5, max: 8 },
  { id: "xl", label: "8 mm 以上", hint: "主石", min: 8, max: Infinity },
];

export const GEMS: Gem[] = [
  { code: "ST-2038", kind: "祖母绿", shape: "祖母绿切", sizeMm: 8.4, carat: 1.8, clarity: "SI", color: "翠绿", cut: "祖母绿切工", defect: "内含物明显，镶爪需避让" },
  { code: "ST-2041", kind: "海蓝宝", shape: "梨形", sizeMm: 9.1, carat: 2.05, clarity: "VVS", color: "圣玛利亚蓝", cut: "梨形明亮" },
  { code: "ST-2044", kind: "蓝宝石", shape: "椭圆", sizeMm: 6.0, carat: 0.85, clarity: "VS", color: "皇家蓝", cut: "椭圆混合" },
  { code: "ST-2046", kind: "红宝石", shape: "椭圆", sizeMm: 5.4, carat: 0.72, clarity: "VS", color: "鸽血红", cut: "椭圆混合" },
  { code: "ST-2048", kind: "蓝宝石", shape: "椭圆", sizeMm: 8.6, carat: 2.4, clarity: "VVS", color: "矢车菊蓝", cut: "椭圆明亮" },
  { code: "ST-2051", kind: "钻石", shape: "圆形", sizeMm: 2.1, carat: 0.09, clarity: "VVS", color: "D", cut: "八心八箭" },
  { code: "ST-2053", kind: "钻石", shape: "圆形", sizeMm: 0.9, carat: 0.015, clarity: "VS", color: "G", cut: "足反" },
  { code: "ST-2054", kind: "钻石", shape: "圆形", sizeMm: 1.0, carat: 0.018, clarity: "VS", color: "F", cut: "足反" },
  { code: "ST-2057", kind: "钻石", shape: "圆形", sizeMm: 1.3, carat: 0.03, clarity: "VVS", color: "E", cut: "足反" },
  { code: "ST-2058", kind: "钻石", shape: "圆形", sizeMm: 2.6, carat: 0.14, clarity: "VS", color: "F", cut: "八心八箭" },
  { code: "ST-2059", kind: "尖晶石", shape: "圆形", sizeMm: 6.8, carat: 1.15, clarity: "VVS", color: "绝地武士", cut: "圆形明亮" },
  { code: "ST-2061", kind: "钻石", shape: "圆形", sizeMm: 1.5, carat: 0.04, clarity: "VS", color: "G", cut: "足反" },
  { code: "ST-2063", kind: "红宝石", shape: "圆形", sizeMm: 2.8, carat: 0.16, clarity: "SI", color: "红色", cut: "圆形明亮" },
  { code: "ST-2066", kind: "蓝宝石", shape: "圆形", sizeMm: 3.0, carat: 0.2, clarity: "VS", color: "青色", cut: "圆形明亮" },
  { code: "ST-2068", kind: "钻石", shape: "圆形", sizeMm: 1.7, carat: 0.055, clarity: "VVS", color: "E", cut: "足反" },
  { code: "ST-2072", kind: "钻石", shape: "圆形", sizeMm: 3.4, carat: 0.26, clarity: "VS", color: "D", cut: "八心八箭" },
  { code: "ST-2074", kind: "钻石", shape: "圆形", sizeMm: 1.9, carat: 0.07, clarity: "VS", color: "F", cut: "足反" },
  { code: "ST-2077", kind: "紫水晶", shape: "祖母绿切", sizeMm: 7.2, carat: 1.3, clarity: "VVS", color: "薰衣草紫", cut: "阶梯切" },
  { code: "ST-2079", kind: "沙弗莱", shape: "梨形", sizeMm: 4.2, carat: 0.31, clarity: "VVS", color: "翠绿", cut: "梨形明亮" },
  { code: "ST-2082", kind: "摩根石", shape: "椭圆", sizeMm: 10.2, carat: 3.1, clarity: "VS", color: "粉橙", cut: "椭圆混合", defect: "亭部边缘细小缺口，建议包边镶口" },
];

export const ORDERS: Order[] = [
  {
    code: "PO-2601",
    customer: "林先生",
    piece: "星芒订婚戒指",
    positions: [
      { id: "main", name: "主石位", need: 1 },
      { id: "shoulder-a", name: "围石 A 组", need: 6 },
      { id: "shoulder-b", name: "围石 B 组", need: 6 },
    ],
  },
  {
    code: "PO-2602",
    customer: "许女士",
    piece: "绿洲吊坠",
    positions: [
      { id: "main", name: "主石位", need: 1 },
      { id: "acc", name: "副石位", need: 2 },
    ],
  },
  {
    code: "PO-2603",
    customer: "周女士",
    piece: "花簇耳坠（对）",
    positions: [
      { id: "main", name: "主石位", need: 2 },
      { id: "halo", name: "围石位", need: 10 },
    ],
  },
];

// 预置的历史分配：PO-2601 主石位与围石 A 组已占用，便于演示独占冲突
export function seedAllocations(): Allocation[] {
  return [
    {
      batchId: "PC-0001",
      orderCode: "PO-2601",
      positionId: "main",
      gemCodes: ["ST-2048"],
      defectNote: "",
      createdAt: "2026-09-24T10:12:00.000Z",
    },
    {
      batchId: "PC-0002",
      orderCode: "PO-2601",
      positionId: "shoulder-a",
      gemCodes: ["ST-2053", "ST-2054", "ST-2057", "ST-2061", "ST-2068", "ST-2074"],
      defectNote: "群镶统一高度，注意色差配对",
      createdAt: "2026-09-25T15:40:00.000Z",
    },
    {
      batchId: "PC-0003",
      orderCode: "PO-2602",
      positionId: "main",
      gemCodes: ["ST-2038"],
      defectNote: "祖母绿内含物明显，镶爪需避让，已标记需客户确认",
      createdAt: "2026-09-26T09:05:00.000Z",
    },
  ];
}

const ALLOC_KEY = "gem-workbench:allocations:v1";
const DRAFT_KEY = "gem-workbench:draft:v1";

export function loadAllocations(): Allocation[] {
  try {
    const raw = localStorage.getItem(ALLOC_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Allocation[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // 忽略损坏的本地记录，回退演示数据
  }
  return seedAllocations();
}

export function saveAllocations(allocations: Allocation[]): void {
  try {
    localStorage.setItem(ALLOC_KEY, JSON.stringify(allocations));
  } catch {
    // 存储不可用时仅在当前页面生效
  }
}

export type Draft = {
  rangeId: string;
  orderCode: string;
  positionId: string;
  defectNote: string;
  selected: string[];
};

export const emptyDraft: Draft = {
  rangeId: "",
  orderCode: ORDERS[0].code,
  positionId: "",
  defectNote: "",
  selected: [],
};

export function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Draft>;
      return {
        rangeId: typeof parsed.rangeId === "string" ? parsed.rangeId : emptyDraft.rangeId,
        orderCode:
          typeof parsed.orderCode === "string" && ORDERS.some((o) => o.code === parsed.orderCode)
            ? parsed.orderCode
            : emptyDraft.orderCode,
        positionId: typeof parsed.positionId === "string" ? parsed.positionId : "",
        defectNote: typeof parsed.defectNote === "string" ? parsed.defectNote : "",
        selected: Array.isArray(parsed.selected) ? parsed.selected.filter((x) => typeof x === "string") : [],
      };
    }
  } catch {
    // 忽略损坏的草稿
  }
  return emptyDraft;
}

export function saveDraft(draft: Draft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // 存储不可用时忽略
  }
}

export function nextBatchId(allocations: Allocation[]): string {
  const max = allocations.reduce((acc, item) => {
    const n = Number(item.batchId.replace(/^PC-/, ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `PC-${String(max + 1).padStart(4, "0")}`;
}

export function inRange(gem: Gem, range: SizeRange | undefined): boolean {
  if (!range) return false;
  return gem.sizeMm >= range.min && gem.sizeMm < range.max;
}
