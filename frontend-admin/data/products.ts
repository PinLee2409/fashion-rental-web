import type { PricingTier, Product, ProductImage, Variant } from "@/lib/types";
import { deaccent, hashString } from "@/lib/utils";
import { sortSizes } from "./catalog";

/* ==========================================================================
   Bảng giá — BR-11
   Mỗi biến thể có giá ngày + các gói thuê. Hệ thống chọn phương án rẻ nhất,
   nên gói luôn được đặt thấp hơn tổng giá ngày tương ứng.
   Ví dụ 350.000₫/ngày → gói 3 ngày 900.000₫ (tiết kiệm 150.000₫).
   ========================================================================== */
const roundTo = (value: number, step: number) => Math.round(value / step) * step;

function makeTiers(pricePerDay: number): PricingTier[] {
  return [
    { days: 3, price: roundTo(pricePerDay * 2.57, 50_000), label: "Gói 3 ngày" },
    { days: 7, price: roundTo(pricePerDay * 4.15, 50_000), label: "Gói 7 ngày" },
  ];
}

function extraDayPriceOf(pricePerDay: number): number {
  return Math.max(50_000, roundTo(pricePerDay * 0.43, 50_000));
}

function colorCode(color: string): string {
  return deaccent(color).replace(/[^a-z]/g, "").slice(0, 2).toUpperCase();
}

const WOMEN_CHART = [
  { size: "XS", bust: "78 – 82", waist: "60 – 63", hip: "86 – 89", length: "135" },
  { size: "S", bust: "83 – 86", waist: "64 – 67", hip: "90 – 93", length: "137" },
  { size: "M", bust: "87 – 90", waist: "68 – 71", hip: "94 – 97", length: "139" },
  { size: "L", bust: "91 – 95", waist: "72 – 76", hip: "98 – 102", length: "141" },
  { size: "XL", bust: "96 – 100", waist: "77 – 82", hip: "103 – 107", length: "143" },
];

const MEN_CHART = [
  { size: "S", bust: "88 – 92", waist: "74 – 78", hip: "90 – 94", length: "70" },
  { size: "M", bust: "93 – 97", waist: "79 – 83", hip: "95 – 99", length: "72" },
  { size: "L", bust: "98 – 102", waist: "84 – 88", hip: "100 – 104", length: "74" },
  { size: "XL", bust: "103 – 108", waist: "89 – 94", hip: "105 – 110", length: "76" },
];

const FREE_CHART = [{ size: "Free", bust: "—", waist: "—", hip: "—", length: "Một cỡ" }];

interface ColorSeed {
  name: string;
  hex: string;
  tone: [string, string];
}

interface ProductSeed {
  slug: string;
  name: string;
  sku: string;
  categorySlug: string;
  brandLine: string;
  description: string;
  material: string;
  careInstruction: string;
  occasions: string[];
  pricePerDay: number;
  deposit: number;
  replacementValue: number;
  rating: number;
  reviewCount: number;
  rentalCount: number;
  sizes: string[];
  colors: ColorSeed[];
  chart: typeof WOMEN_CHART;
  editorialNote: string;
  isNew?: boolean;
  isFeatured?: boolean;
  /** Số cá thể mặc định cho mỗi biến thể */
  units?: number;
  /** Ghi đè số cá thể theo "Size|Màu" — 0 nghĩa là biến thể đó không còn cá thể khai thác */
  unitOverrides?: Record<string, number>;
}

const IMAGE_MOTIFS: ProductImage["motif"][] = ["portrait", "drape", "detail", "runway", "still-life"];

/** Xoay thứ tự motif theo sản phẩm để lưới ảnh không bị lặp một kiểu bố cục. */
function motifsFor(slug: string): ProductImage["motif"][] {
  const offset = hashString(slug) % IMAGE_MOTIFS.length;
  return [...IMAGE_MOTIFS.slice(offset), ...IMAGE_MOTIFS.slice(0, offset)];
}

function buildImages(seed: ProductSeed): ProductImage[] {
  const primaryTone = seed.colors[0].tone;
  return motifsFor(seed.slug).slice(0, 4).map((motif, i) => ({
    id: `${seed.slug}-img-${i + 1}`,
    motif,
    tone: (seed.colors[i % seed.colors.length]?.tone ?? primaryTone) as [string, string],
    alt: `${seed.name} — ảnh ${i + 1}`,
  }));
}

/**
 * Mã màu 2 ký tự phải là duy nhất trong một sản phẩm, vì nó nằm trong barcode
 * của biến thể và barcode lại là tiền tố của mọi mã cá thể. Hai màu cùng đầu
 * ("Trắng ngà" / "Trắng tinh") mà trùng mã thì hai cá thể khác nhau sẽ mang
 * cùng một mã QR — quét ở quầy sẽ ra nhầm món.
 */
function colorCodesOf(colors: ColorSeed[]): Map<string, string> {
  const used = new Set<string>();
  const map = new Map<string, string>();
  for (const color of colors) {
    const base = colorCode(color.name);
    let candidate = base;
    // Đụng mã thì lấy ký tự thứ hai lùi dần trong tên, cuối cùng mới đánh số.
    const letters = deaccent(color.name).replace(/[^a-z]/g, "");
    for (let i = 2; used.has(candidate) && i < letters.length; i += 1) {
      candidate = (letters[0] + letters[i]).toUpperCase();
    }
    for (let n = 2; used.has(candidate); n += 1) {
      candidate = (base[0] + String(n)).toUpperCase();
    }
    used.add(candidate);
    map.set(color.name, candidate);
  }
  return map;
}

function buildVariants(seed: ProductSeed): Variant[] {
  const variants: Variant[] = [];
  const codes = colorCodesOf(seed.colors);
  for (const color of seed.colors) {
    for (const size of sortSizes(seed.sizes)) {
      const key = `${size}|${color.name}`;
      const unitCount = seed.unitOverrides?.[key] ?? seed.units ?? 3;
      variants.push({
        id: `${seed.slug}--${deaccent(size)}--${deaccent(color.name).replace(/\s+/g, "-")}`,
        productId: seed.slug,
        size,
        color: color.name,
        colorHex: color.hex,
        pricePerDay: seed.pricePerDay,
        depositAmount: seed.deposit,
        extraDayPrice: extraDayPriceOf(seed.pricePerDay),
        tiers: makeTiers(seed.pricePerDay),
        unitCount,
        barcode: `${seed.sku}-${size}-${codes.get(color.name)}`,
      });
    }
  }
  return variants;
}

function buildProduct(seed: ProductSeed): Product {
  return {
    id: seed.slug,
    slug: seed.slug,
    sku: seed.sku,
    name: seed.name,
    categorySlug: seed.categorySlug,
    brandLine: seed.brandLine,
    description: seed.description,
    material: seed.material,
    careInstruction: seed.careInstruction,
    occasions: seed.occasions,
    sizeChart: seed.chart,
    basePrice: seed.pricePerDay,
    baseDeposit: seed.deposit,
    replacementValue: seed.replacementValue,
    isFeatured: seed.isFeatured ?? false,
    isNew: seed.isNew ?? false,
    rating: seed.rating,
    reviewCount: seed.reviewCount,
    rentalCount: seed.rentalCount,
    images: buildImages(seed),
    variants: buildVariants(seed),
    editorialNote: seed.editorialNote,
  };
}

/* ==========================================================================
   Dữ liệu mẫu — 20 sản phẩm
   ========================================================================== */

const SEEDS: ProductSeed[] = [
  {
    slug: "ao-dai-cach-tan-do-theu-sen",
    name: "Áo dài cách tân đỏ thêu sen",
    sku: "AD",
    categorySlug: "ao-dai",
    brandLine: "Nhà may Hạ Long",
    description:
      "Áo dài cách tân dáng suông, tà ngắn vừa phải, thêu tay hoạ tiết sen chạy dọc thân trước. Cổ thuyền mềm, tay raglan nên dễ mặc và dễ lên hình. Bộ gồm áo và quần lụa cùng tông.",
    material: "Lụa tơ tằm Bảo Lộc, thêu tay chỉ tơ",
    careInstruction: "Không giặt máy. Shop chịu trách nhiệm giặt hấp sau khi trả đồ.",
    occasions: ["cuoi", "tet", "chup-anh"],
    pricePerDay: 350_000,
    deposit: 500_000,
    replacementValue: 4_200_000,
    rating: 4.6,
    reviewCount: 32,
    rentalCount: 118,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Đỏ", hex: "#9c2b33", tone: ["#7c2230", "#e8cfc6"] },
      { name: "Vàng", hex: "#c8992f", tone: ["#a97f21", "#f3e6c8"] },
      { name: "Trắng", hex: "#f2efe9", tone: ["#cfc6b8", "#faf7f2"] },
    ],
    chart: WOMEN_CHART,
    editorialNote: "Mẫu áo dài được thuê nhiều nhất mùa cưới 2026.",
    isFeatured: true,
    units: 3,
    unitOverrides: {
      // Không còn cá thể khai thác cho màu trắng (đang thanh lý) và size XL đỏ
      "S|Trắng": 0,
      "M|Trắng": 0,
      "L|Trắng": 0,
      "XL|Trắng": 0,
      "XL|Đỏ": 0,
      "L|Vàng": 1,
    },
  },
  {
    slug: "ao-dai-lua-ngu-sac-ngoc-trai",
    name: "Áo dài lụa ngũ sắc ngọc trai",
    sku: "ADN",
    categorySlug: "ao-dai",
    brandLine: "Nhà may Hạ Long",
    description:
      "Áo dài truyền thống tà dài, chất lụa ngũ sắc đổi màu theo ánh sáng, đính ngọc trai nhỏ ở cổ và cửa tay. Dáng ôm nhẹ, tôn eo mà vẫn thoải mái ngồi lâu.",
    material: "Lụa ngũ sắc, đính ngọc trai nhân tạo",
    careInstruction: "Tránh nước hoa xịt trực tiếp lên vải. Không tự tẩy vết bẩn.",
    occasions: ["cuoi", "tet", "khach-moi-cuoi"],
    pricePerDay: 420_000,
    deposit: 700_000,
    replacementValue: 5_600_000,
    rating: 4.8,
    reviewCount: 24,
    rentalCount: 76,
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Ngà", hex: "#eee6d8", tone: ["#cbbda9", "#f6f2ec"] },
      { name: "Hồng phấn", hex: "#dcb4b0", tone: ["#b98a86", "#f5e6e3"] },
    ],
    chart: WOMEN_CHART,
    editorialNote: "Lụa đổi màu dưới đèn — lên ảnh cưới rất có chiều sâu.",
    isNew: true,
    isFeatured: true,
    units: 2,
    unitOverrides: { "XS|Hồng phấn": 1, "L|Hồng phấn": 0 },
  },
  {
    slug: "dam-da-hoi-satin-midnight",
    name: "Đầm dạ hội satin Midnight",
    sku: "DH",
    categorySlug: "dam-da-hoi",
    brandLine: "Atelier Sương",
    description:
      "Đầm dài chất satin nặng tay, xẻ tà cao vừa phải, thân trên cúp ngực có gọng định hình. Màu xanh đêm sâu, phản sáng nhẹ dưới đèn tiệc.",
    material: "Satin lụa pha, lót lưới định hình",
    careInstruction: "Giặt khô. Cẩn thận với khoá kéo sau lưng khi thay đồ.",
    occasions: ["da-tiec", "chup-anh", "cong-so"],
    pricePerDay: 480_000,
    deposit: 800_000,
    replacementValue: 6_800_000,
    rating: 4.7,
    reviewCount: 41,
    rentalCount: 94,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Xanh đêm", hex: "#232b42", tone: ["#1e2436", "#b9b2c4"] },
      { name: "Đen", hex: "#1a1a1a", tone: ["#171717", "#b8b4b0"] },
    ],
    chart: WOMEN_CHART,
    editorialNote: "Dáng đầm được stylist chọn nhiều nhất cho gala cuối năm.",
    isFeatured: true,
    units: 3,
    unitOverrides: { "XS|Đen": 1, "XL|Xanh đêm": 0 },
  },
  {
    slug: "dam-da-hoi-champagne-xep-ly",
    name: "Đầm dạ hội champagne xếp ly",
    sku: "DHC",
    categorySlug: "dam-da-hoi",
    brandLine: "Atelier Sương",
    description:
      "Đầm dạ hội màu champagne, thân váy xếp ly tay tạo khối mềm, vai lệch một bên. Phù hợp cho khách mời đám cưới muốn nổi bật vừa đủ.",
    material: "Voan tơ xếp ly thủ công",
    careInstruction: "Treo móc có đệm vai, không gấp để tránh gãy ly.",
    occasions: ["khach-moi-cuoi", "da-tiec", "chup-anh"],
    pricePerDay: 450_000,
    deposit: 750_000,
    replacementValue: 6_200_000,
    rating: 4.5,
    reviewCount: 19,
    rentalCount: 58,
    sizes: ["S", "M", "L"],
    colors: [{ name: "Champagne", hex: "#d7bd93", tone: ["#c9a87c", "#f4ece0"] }],
    chart: WOMEN_CHART,
    editorialNote: "Một màu champagne ăn đèn, không lấn át cô dâu.",
    units: 2,
    unitOverrides: { "L|Champagne": 1 },
  },
  {
    slug: "vay-cuoi-ren-phap-tay-phong",
    name: "Váy cưới ren Pháp tay phồng",
    sku: "VC",
    categorySlug: "vay-cuoi",
    brandLine: "Maison Blanc",
    description:
      "Váy cưới dáng A, thân trên ren Pháp đính tay, tay phồng rời có thể tháo. Chân váy tulle nhiều lớp, đuôi dài 1m2.",
    material: "Ren Pháp, tulle mềm 6 lớp",
    careInstruction: "Cần 2 ngày giặt hấp chuyên sâu sau mỗi lượt thuê.",
    occasions: ["cuoi", "chup-anh"],
    pricePerDay: 1_200_000,
    deposit: 3_000_000,
    replacementValue: 24_000_000,
    rating: 4.9,
    reviewCount: 27,
    rentalCount: 41,
    sizes: ["S", "M", "L"],
    colors: [
      { name: "Trắng ngà", hex: "#f4efe6", tone: ["#ded5c8", "#faf7f2"] },
      { name: "Trắng tinh", hex: "#fdfdfb", tone: ["#e6e3dd", "#ffffff"] },
    ],
    chart: WOMEN_CHART,
    editorialNote: "Đuôi váy 1m2 — nhớ chừa thời gian thử trước ngày cưới.",
    isFeatured: true,
    units: 1,
  },
  {
    slug: "vay-cuoi-satin-toi-gian",
    name: "Váy cưới satin tối giản",
    sku: "VCS",
    categorySlug: "vay-cuoi",
    brandLine: "Maison Blanc",
    description:
      "Váy cưới satin trơn, cổ vuông, dáng ôm nhẹ theo đường cơ thể. Không ren, không đính kết — dành cho cô dâu thích sự tối giản.",
    material: "Satin lụa dày, lót cotton",
    careInstruction: "Giặt hấp chuyên dụng, tránh móng tay sắc làm xước mặt satin.",
    occasions: ["cuoi", "chup-anh"],
    pricePerDay: 950_000,
    deposit: 2_400_000,
    replacementValue: 18_000_000,
    rating: 4.8,
    reviewCount: 15,
    rentalCount: 33,
    sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "Ngà", hex: "#f1ece1", tone: ["#d8cfc0", "#faf7f2"] }],
    chart: WOMEN_CHART,
    editorialNote: "Tối giản nhưng khó tính về form — nên đặt kèm số đo.",
    isNew: true,
    units: 1,
    unitOverrides: { "XS|Ngà": 0 },
  },
  {
    slug: "dam-nhung-cocktail-ruou-vang",
    name: "Đầm nhung cocktail rượu vang",
    sku: "DN",
    categorySlug: "dam-du-tiec",
    brandLine: "Atelier Sương",
    description:
      "Đầm nhung dáng midi, tay dài bo cổ tay, thắt eo nhẹ. Màu rượu vang trầm, hợp tiệc tối mùa lạnh và tiệc cuối năm.",
    material: "Nhung tăm cao cấp, lót lụa",
    careInstruction: "Không là trực tiếp lên mặt nhung.",
    occasions: ["da-tiec", "hen-ho", "cong-so"],
    pricePerDay: 320_000,
    deposit: 500_000,
    replacementValue: 3_800_000,
    rating: 4.4,
    reviewCount: 36,
    rentalCount: 102,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Rượu vang", hex: "#5d2733", tone: ["#4a2a3c", "#d8c3cf"] },
      { name: "Xanh rêu", hex: "#3f4a37", tone: ["#38412f", "#ccd2be"] },
    ],
    chart: WOMEN_CHART,
    editorialNote: "Chất nhung lên ảnh dày dặn, không cần phụ kiện cầu kỳ.",
    units: 3,
    unitOverrides: { "XL|Xanh rêu": 0 },
  },
  {
    slug: "dam-hoa-maxi-vuon-xuan",
    name: "Đầm hoa maxi Vườn Xuân",
    sku: "DM",
    categorySlug: "dam-du-tiec",
    brandLine: "Nhà may Hạ Long",
    description:
      "Đầm maxi voan in hoa loang, tay bồng nhẹ, dây rút eo điều chỉnh được. Thoáng, nhẹ, hợp tiệc ngoài trời và đi biển.",
    material: "Voan tơ in kỹ thuật số",
    careInstruction: "Tránh phơi nắng gắt làm phai màu in.",
    occasions: ["khach-moi-cuoi", "hen-ho", "chup-anh"],
    pricePerDay: 250_000,
    deposit: 400_000,
    replacementValue: 2_600_000,
    rating: 4.3,
    reviewCount: 52,
    rentalCount: 147,
    sizes: ["S", "M", "L"],
    colors: [
      { name: "Hoa xanh", hex: "#7b8f6a", tone: ["#6a7a52", "#e5e2cf"] },
      { name: "Hoa hồng", hex: "#c98f95", tone: ["#b1737a", "#f2e0e0"] },
    ],
    chart: WOMEN_CHART,
    editorialNote: "Bán chạy mùa tiệc cưới ngoài trời — nên đặt sớm 2 tuần.",
    units: 4,
  },
  {
    slug: "dam-lua-halter-toi-gian",
    name: "Đầm lụa halter tối giản",
    sku: "DL",
    categorySlug: "dam-du-tiec",
    brandLine: "Studio Muối",
    description:
      "Đầm lụa cổ yếm buộc sau gáy, lưng trần, chân váy rủ theo trọng lực vải. Một thiết kế đơn giản nhưng kén dáng.",
    material: "Lụa satin hai mặt",
    careInstruction: "Giặt khô. Không vắt xoắn.",
    occasions: ["hen-ho", "da-tiec", "chup-anh"],
    pricePerDay: 290_000,
    deposit: 450_000,
    replacementValue: 3_200_000,
    rating: 4.5,
    reviewCount: 28,
    rentalCount: 81,
    sizes: ["XS", "S", "M"],
    colors: [
      { name: "Nâu đất", hex: "#8e6259", tone: ["#8e6259", "#eadfd8"] },
      { name: "Đen", hex: "#1a1a1a", tone: ["#1d1d1d", "#c4c0bc"] },
    ],
    chart: WOMEN_CHART,
    editorialNote: "Lụa hai mặt — mặc được cả hai bên tuỳ độ bóng bạn muốn.",
    isNew: true,
    units: 2,
  },
  {
    slug: "dam-ivory-toi-gian-co-vuong",
    name: "Đầm ivory tối giản cổ vuông",
    sku: "DI",
    categorySlug: "dam-du-tiec",
    brandLine: "Studio Muối",
    description:
      "Đầm midi màu ivory, cổ vuông, tay ngắn có độ đứng. Dáng đầm trung tính, dễ phối phụ kiện, hợp cả lễ ăn hỏi lẫn tiệc công ty.",
    material: "Tuyết mưa cao cấp",
    careInstruction: "Là hơi ở nhiệt độ thấp.",
    occasions: ["khach-moi-cuoi", "cong-so", "hen-ho"],
    pricePerDay: 220_000,
    deposit: 350_000,
    replacementValue: 2_200_000,
    rating: 4.2,
    reviewCount: 44,
    rentalCount: 133,
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Ivory", hex: "#efe8dc", tone: ["#ded5c8", "#faf7f2"] }],
    chart: WOMEN_CHART,
    editorialNote: "Món an toàn nhất trong tủ đồ đi tiệc.",
    units: 4,
  },
  {
    slug: "trench-coat-oversized-be",
    name: "Trench coat oversized be",
    sku: "TC",
    categorySlug: "ao-khoac",
    brandLine: "Studio Muối",
    description:
      "Trench dáng rộng, hai hàng khuy, đai eo rời. Vai thả tự nhiên nên mặc ngoài đầm dài hay suit đều cân.",
    material: "Kaki cotton pha, lót lụa",
    careInstruction: "Giặt khô để giữ form vai.",
    occasions: ["chup-anh", "hen-ho", "cong-so"],
    pricePerDay: 200_000,
    deposit: 350_000,
    replacementValue: 2_800_000,
    rating: 4.6,
    reviewCount: 21,
    rentalCount: 67,
    sizes: ["S", "M", "L"],
    colors: [
      { name: "Be", hex: "#c4ab86", tone: ["#9b8467", "#efe6d8"] },
      { name: "Đen", hex: "#1f1f1f", tone: ["#212121", "#c2bdb8"] },
    ],
    chart: WOMEN_CHART,
    editorialNote: "Lớp ngoài cứu cả outfit trong những buổi chụp ngoài trời.",
    units: 3,
  },
  {
    slug: "ao-khoac-da-vintage",
    name: "Áo khoác da vintage",
    sku: "AK",
    categorySlug: "ao-khoac",
    brandLine: "Kho Cũ Sài Gòn",
    description:
      "Áo khoác da thật dáng biker, lớp da đã lên màu theo thời gian. Mỗi cá thể có vết xước riêng — đó là nét của món đồ vintage.",
    material: "Da bò thuộc, lót polyester",
    careInstruction: "Không phơi nắng. Shop xử lý dưỡng da sau mỗi lượt thuê.",
    occasions: ["chup-anh", "bieu-dien", "hen-ho"],
    pricePerDay: 260_000,
    deposit: 600_000,
    replacementValue: 5_400_000,
    rating: 4.7,
    reviewCount: 18,
    rentalCount: 54,
    sizes: ["S", "M", "L"],
    colors: [{ name: "Nâu hạt dẻ", hex: "#4a3529", tone: ["#3a2c25", "#c9b7a6"] }],
    chart: WOMEN_CHART,
    editorialNote: "Đồ vintage — vết xước có sẵn đã được ghi trong biên bản lúc giao.",
    units: 1,
  },
  {
    slug: "vest-nam-navy-may-do",
    name: "Vest nam navy may đo",
    sku: "VS",
    categorySlug: "vest-nam",
    brandLine: "Nhà may Trần",
    description:
      "Bộ vest hai mảnh màu navy, ve xuôi, dáng slim. Bao gồm áo vest và quần âu; áo sơ mi và cà vạt thuê thêm.",
    material: "Len pha polyester 320gsm",
    careInstruction: "Treo móc gỗ, không gấp trong vali.",
    occasions: ["cuoi", "cong-so", "da-tiec"],
    pricePerDay: 300_000,
    deposit: 600_000,
    replacementValue: 5_000_000,
    rating: 4.5,
    reviewCount: 38,
    rentalCount: 126,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Navy", hex: "#2a3a55", tone: ["#22304a", "#c2c9d6"] },
      { name: "Ghi", hex: "#6f7275", tone: ["#5c6064", "#d5d6d7"] },
    ],
    chart: MEN_CHART,
    editorialNote: "Dáng slim — người vai rộng nên chọn lên một size.",
    isFeatured: true,
    units: 3,
    unitOverrides: { "S|Ghi": 0, "XL|Ghi": 1 },
  },
  {
    slug: "tuxedo-den-ve-satin",
    name: "Tuxedo đen ve satin",
    sku: "TX",
    categorySlug: "tuxedo",
    brandLine: "Nhà may Trần",
    description:
      "Tuxedo đen cổ điển, ve satin bản vừa, một khuy. Bộ gồm áo, quần và nơ đen. Chuẩn black-tie cho tiệc tối.",
    material: "Len Ý pha, ve satin",
    careInstruction: "Giặt khô. Tránh để nơ satin bị gấp nếp.",
    occasions: ["da-tiec", "cuoi", "cong-so"],
    pricePerDay: 380_000,
    deposit: 800_000,
    replacementValue: 7_500_000,
    rating: 4.8,
    reviewCount: 22,
    rentalCount: 71,
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Đen", hex: "#141414", tone: ["#171717", "#b8b4b0"] }],
    chart: MEN_CHART,
    editorialNote: "Chuẩn black-tie: nơ đen, giày da bóng, không thắt lưng.",
    isFeatured: true,
    units: 2,
    unitOverrides: { "S|Đen": 1 },
  },
  {
    slug: "ao-dai-nam-gam-lam",
    name: "Áo dài nam gấm lam",
    sku: "ADM",
    categorySlug: "ao-dai-nam",
    brandLine: "Nhà may Hạ Long",
    description:
      "Áo dài nam chất gấm hoa văn chìm, màu lam trầm, kèm khăn đóng. Dáng rộng thoải mái, hợp lễ ăn hỏi và lễ gia tiên.",
    material: "Gấm tơ tằm, khăn đóng cùng bộ",
    careInstruction: "Giặt khô. Khăn đóng giữ trong hộp cứng khi di chuyển.",
    occasions: ["cuoi", "tet", "chup-anh"],
    pricePerDay: 330_000,
    deposit: 550_000,
    replacementValue: 4_600_000,
    rating: 4.6,
    reviewCount: 17,
    rentalCount: 63,
    sizes: ["M", "L", "XL"],
    colors: [
      { name: "Lam", hex: "#2c4a63", tone: ["#254257", "#c3d2dc"] },
      { name: "Đỏ đô", hex: "#7b2230", tone: ["#6e2029", "#e3c7c4"] },
    ],
    chart: MEN_CHART,
    editorialNote: "Thuê theo cặp với áo dài nữ sẽ được gợi ý đồng bộ tông màu.",
    units: 2,
  },
  {
    slug: "do-bieu-dien-anh-kim",
    name: "Đồ biểu diễn ánh kim",
    sku: "BD",
    categorySlug: "do-bieu-dien",
    brandLine: "Sân Khấu 42",
    description:
      "Bộ biểu diễn hai mảnh chất liệu ánh kim, đính đá phản quang. Thiết kế để bắt đèn sân khấu, co giãn tốt cho vũ đạo.",
    material: "Vải ánh kim co giãn, đá phản quang",
    careInstruction: "Không giặt máy — đá dễ bong. Báo shop nếu rơi đá.",
    occasions: ["bieu-dien", "chup-anh"],
    pricePerDay: 280_000,
    deposit: 600_000,
    replacementValue: 4_000_000,
    rating: 4.4,
    reviewCount: 14,
    rentalCount: 49,
    sizes: ["S", "M", "L"],
    colors: [
      { name: "Bạc", hex: "#b9bec4", tone: ["#8d949c", "#e8ecef"] },
      { name: "Xanh ngọc", hex: "#2f6d6a", tone: ["#2f4a4a", "#cfe0da"] },
    ],
    chart: WOMEN_CHART,
    editorialNote: "Đá phản quang rất dễ bong — vui lòng không tự xử lý tại nhà.",
    units: 2,
    unitOverrides: { "L|Bạc": 1 },
  },
  {
    slug: "trang-phuc-le-hoi-truyen-thong",
    name: "Trang phục lễ hội truyền thống",
    sku: "LH",
    categorySlug: "do-bieu-dien",
    brandLine: "Sân Khấu 42",
    description:
      "Bộ trang phục lễ hội nhiều lớp, hoạ tiết thổ cẩm dệt tay, kèm mũ và thắt lưng. Dùng cho tiết mục sân khấu và lễ hội văn hoá.",
    material: "Thổ cẩm dệt tay, kim tuyến thủ công",
    careInstruction: "Giặt khô riêng từng lớp. Phụ kiện trả đủ theo danh sách.",
    occasions: ["bieu-dien", "chup-anh", "tet"],
    pricePerDay: 310_000,
    deposit: 700_000,
    replacementValue: 5_200_000,
    rating: 4.5,
    reviewCount: 11,
    rentalCount: 28,
    sizes: ["M", "L"],
    colors: [{ name: "Cam đất", hex: "#a85a2c", tone: ["#8c3b18", "#f0d9c0"] }],
    chart: WOMEN_CHART,
    editorialNote: "Bộ gồm 6 món phụ kiện — kiểm đủ trước khi rời cửa hàng.",
    units: 1,
  },
  {
    slug: "clutch-ngoc-trai-da-tiec",
    name: "Clutch ngọc trai dạ tiệc",
    sku: "CL",
    categorySlug: "tui-clutch",
    brandLine: "Studio Muối",
    description:
      "Clutch nhỏ đính ngọc trai, khung kim loại mạ vàng nhạt, kèm dây xích rời. Vừa điện thoại và son.",
    material: "Ngọc trai nhân tạo, khung hợp kim",
    careInstruction: "Tránh va đập mạnh làm lệch khung.",
    occasions: ["da-tiec", "khach-moi-cuoi", "cuoi"],
    pricePerDay: 120_000,
    deposit: 300_000,
    replacementValue: 1_800_000,
    rating: 4.3,
    reviewCount: 26,
    rentalCount: 112,
    sizes: ["Free"],
    colors: [
      { name: "Trắng ngọc", hex: "#efe9e2", tone: ["#b9a89b", "#f2ece6"] },
      { name: "Vàng đồng", hex: "#c2a15e", tone: ["#a2833f", "#f0e4cd"] },
    ],
    chart: FREE_CHART,
    editorialNote: "Phụ kiện không cần thời gian đệm — trả hôm nay, mai cho thuê tiếp.",
    units: 4,
  },
  {
    slug: "bong-tai-pha-le-nho-giot",
    name: "Bông tai pha lê nhỏ giọt",
    sku: "BT",
    categorySlug: "trang-suc",
    brandLine: "Studio Muối",
    description:
      "Bông tai pha lê dáng giọt nước, móc bạc 925. Nhẹ tai, hợp đầm dạ hội cổ trễ và áo dài cổ thuyền.",
    material: "Pha lê Áo, móc bạc 925",
    careInstruction: "Lau khô sau khi dùng, cất trong hộp nhung của shop.",
    occasions: ["da-tiec", "cuoi", "khach-moi-cuoi"],
    pricePerDay: 90_000,
    deposit: 250_000,
    replacementValue: 1_400_000,
    rating: 4.6,
    reviewCount: 33,
    rentalCount: 156,
    sizes: ["Free"],
    colors: [{ name: "Bạc", hex: "#cfd3d6", tone: ["#a8adb2", "#eef0f1"] }],
    chart: FREE_CHART,
    editorialNote: "Thuê kèm đầm dạ hội được gợi ý tự động ở bước cuối.",
    units: 5,
  },
  {
    slug: "set-linen-mua-he",
    name: "Set linen mùa hè",
    sku: "SL",
    categorySlug: "dam-du-tiec",
    brandLine: "Studio Muối",
    description:
      "Set hai mảnh chất linen tưng: áo croptop tay lỡ và chân váy dài. Màu cát ấm, hợp du lịch biển và chụp ảnh ngoài trời.",
    material: "Linen tưng 100%",
    careInstruction: "Linen dễ nhăn tự nhiên — đó là đặc tính của chất liệu.",
    occasions: ["hen-ho", "chup-anh"],
    pricePerDay: 180_000,
    deposit: 300_000,
    replacementValue: 1_900_000,
    rating: 4.1,
    reviewCount: 29,
    rentalCount: 88,
    sizes: ["S", "M", "L"],
    colors: [
      { name: "Cát", hex: "#c9bda6", tone: ["#a9a08d", "#f3efe6"] },
      { name: "Xanh biển", hex: "#6d8a99", tone: ["#557383", "#dfe8ec"] },
    ],
    chart: WOMEN_CHART,
    editorialNote: "Linen nhăn nhẹ là bình thường, shop không tính đây là lỗi.",
    isNew: true,
    units: 3,
  },
];

export const PRODUCTS: Product[] = SEEDS.map(buildProduct);

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getVariant(product: Product, variantId: string): Variant | undefined {
  return product.variants.find((v) => v.id === variantId);
}

export function findVariantGlobal(variantId: string): { product: Product; variant: Variant } | undefined {
  for (const product of PRODUCTS) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return undefined;
}

export function productsByCategory(categorySlug: string): Product[] {
  return PRODUCTS.filter((p) => p.categorySlug === categorySlug);
}

export function productColors(product: Product): { name: string; hex: string }[] {
  const seen = new Map<string, string>();
  for (const v of product.variants) if (!seen.has(v.color)) seen.set(v.color, v.colorHex);
  return [...seen.entries()].map(([name, hex]) => ({ name, hex }));
}

export function productSizes(product: Product): string[] {
  return sortSizes([...new Set(product.variants.map((v) => v.size))]);
}

/** Tổng số cá thể đang khai thác của một sản phẩm. */
export function productUnitTotal(product: Product): number {
  return product.variants.reduce((sum, v) => sum + v.unitCount, 0);
}
