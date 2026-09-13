import { CONDITION_FEES, SETTINGS, STORE } from "@/lib/settings";

export const HERO = {
  eyebrow: "Cho thuê trang phục cao cấp · TP. Hồ Chí Minh",
  headline: ["WEAR MORE.", "OWN LESS."],
  body: "Thuê trang phục cao cấp cho từng khoảnh khắc, không cần chất đầy tủ đồ. Chọn ngày, kiểm tra lịch trống, nhận đồ đã giặt ủi chỉn chu.",
  primaryCta: { label: "Khám phá bộ sưu tập", href: "/danh-muc/tat-ca" },
  secondaryCta: { label: "Thuê đồ hoạt động thế nào", href: "/huong-dan" },
  stats: [
    { value: "1.200+", label: "Lượt thuê đã hoàn tất" },
    { value: "4,7/5", label: "Điểm hài lòng trung bình" },
    { value: "48h", label: "Giặt hấp & kiểm tra mỗi lượt" },
  ],
};

export const MARQUEE_WORDS = [
  "Áo dài",
  "Dạ hội",
  "Váy cưới",
  "Tuxedo",
  "Biểu diễn",
  "Clutch",
  "Trench",
  "Cocktail",
  "Linen",
  "Gấm",
];

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Chọn ngày thuê",
    body: "Nhập ngày nhận và ngày trả. Lịch sẽ tô màu những ngày còn đồ và chặn ngày đã kín.",
  },
  {
    step: "02",
    title: "Chọn size & màu",
    body: "Biến thể nào hết đồ trong khoảng ngày bạn chọn sẽ tự động mờ đi, không phải đoán.",
  },
  {
    step: "03",
    title: "Đặt cọc giữ chỗ",
    body: `Trả trước tiền cọc + ${Math.round(
      SETTINGS.prepay_rental_rate * 100,
    )}% tiền thuê. Phần còn lại thanh toán khi nhận đồ.`,
  },
  {
    step: "04",
    title: "Nhận — Mặc — Trả",
    body: "Nhận tại cửa hàng hoặc giao tận nơi. Trả đồ nguyên vẹn, cọc được hoàn sau khi kiểm tra.",
  },
];

export const WHY_RENT = [
  {
    title: "Cọc luôn được hoàn",
    body: "Tiền cọc không phải chi phí. Trả đồ đúng hẹn và nguyên vẹn, bạn nhận lại 100%.",
  },
  {
    title: "Giặt hấp trước mỗi lượt",
    body: "Mỗi món có 1–2 ngày đệm để giặt ủi và kiểm tra. Bạn luôn nhận đồ sạch, đã là phẳng.",
  },
  {
    title: "Biết ngay còn hay hết",
    body: "Hệ thống theo dõi từng cá thể trang phục, nên số lượng còn lại hiển thị theo đúng ngày bạn chọn.",
  },
  {
    title: "Giá theo gói, rẻ dần theo ngày",
    body: "Thuê 3 hay 7 ngày đều có gói riêng. Hệ thống tự chọn phương án rẻ nhất cho bạn.",
  },
];

export const EDITORIAL = {
  eyebrow: "Chiến dịch mùa cưới 2026",
  title: "Một chiếc áo dài, ba thế hệ cùng nhìn về một hướng",
  body: "Mùa cưới năm nay, chúng tôi chụp bộ ảnh cùng ba thế hệ trong một gia đình ở Quận 5 — bà, mẹ và cô dâu, mỗi người một dáng áo dài. Cả ba bộ đều đến từ tủ đồ cho thuê của StyleRent.",
  cta: { label: "Xem bộ sưu tập cưới", href: "/dip/cuoi" },
};

export const LOOKBOOK = [
  { caption: "Lễ ăn hỏi · Quận 5", handle: "@duyen.tran", slug: "ao-dai-cach-tan-do-theu-sen" },
  { caption: "Gala cuối năm · Landmark", handle: "@hamy.vu", slug: "dam-da-hoi-satin-midnight" },
  { caption: "Chụp ảnh cưới · Đà Lạt", handle: "@thanhvan", slug: "vay-cuoi-ren-phap-tay-phong" },
  { caption: "Year end party", handle: "@minhquan", slug: "vest-nam-navy-may-do" },
  { caption: "Tiệc cưới ngoài trời", handle: "@phuonganh.ngo", slug: "dam-hoa-maxi-vuon-xuan" },
  { caption: "Lookbook mùa hè", handle: "@quynhnhu", slug: "set-linen-mua-he" },
];

export const FAQ = [
  {
    q: "Tiền cọc có phải là phí thuê không?",
    a: "Không. Tiền cọc được giữ tạm và hoàn lại sau khi bạn trả đồ, shop kiểm tra và xác nhận đồ nguyên vẹn. Chỉ phần phí phát sinh (nếu có) mới bị trừ vào cọc.",
  },
  {
    q: "Vì sao có ngày không cho đặt dù đồ đang rảnh?",
    a: "Sau mỗi lượt thuê, mỗi món cần thời gian đệm để giặt ủi và kiểm tra — áo dài 1 ngày, váy cưới 2 ngày, phụ kiện không cần. Những ngày đệm này sẽ không nhận đặt.",
  },
  {
    q: "Giữ chỗ trong giỏ thuê kéo dài bao lâu?",
    a: `${SETTINGS.hold_ttl_minutes} phút kể từ khi bạn thêm món vào giỏ. Khi bước sang thanh toán, hệ thống gia hạn giữ chỗ lên ${SETTINGS.checkout_ttl_minutes} phút.`,
  },
  {
    q: "Tôi phải trả bao nhiêu ngay khi đặt?",
    a: `Mặc định là cọc giữ chỗ: toàn bộ tiền cọc + ${Math.round(
      SETTINGS.prepay_rental_rate * 100,
    )}% tiền thuê. Nếu chọn trả đủ ngay, bạn được giảm thêm ${Math.round(
      SETTINGS.full_payment_discount * 100,
    )}% tiền thuê.`,
  },
  {
    q: "Trễ hạn trả thì tính phí ra sao?",
    a: `Ân hạn ${SETTINGS.late_fee_grace_hours} giờ sau giờ hẹn. Sau đó mỗi ngày trễ tính ${SETTINGS.late_fee_rate}× tiền thuê ngày của món đó, tối đa ${SETTINGS.late_fee_cap_multiplier}× tiền cọc.`,
  },
  {
    q: "Tôi có được gia hạn thêm ngày không?",
    a: "Được, nếu gửi yêu cầu trước hạn trả ít nhất 12 giờ và món đó chưa có khách đặt tiếp. Tiền gia hạn tính theo giá ngày thuê thêm.",
  },
  {
    q: "Đồ không vừa thì sao?",
    a: "Hãy điền số đo trong hồ sơ để shop soạn cá thể phù hợp nhất. Với đồ cần sửa vừa người, vui lòng nhận đồ trước ngày sự kiện ít nhất 1 ngày.",
  },
  {
    q: "Giao tận nơi áp dụng ở đâu?",
    a: `Nội thành ${STORE.address.split(",").slice(-1)[0].trim()} và một số tỉnh lân cận. Địa chỉ ngoài vùng giao sẽ chỉ hiển thị hình thức nhận tại cửa hàng.`,
  },
];

export const POLICY_SECTIONS = [
  {
    id: "dat-thue",
    title: "Đặt thuê & giữ chỗ",
    items: [
      `Chỉ nhận đặt trong khoảng từ hôm nay đến ${SETTINGS.max_advance_days} ngày tới.`,
      `Thời gian thuê tối thiểu ${SETTINGS.min_rental_days} ngày, tối đa ${SETTINGS.max_rental_days} ngày. Vượt mức này vui lòng liên hệ shop.`,
      `Món đồ được giữ chỗ ${SETTINGS.hold_ttl_minutes} phút trong giỏ thuê, và ${SETTINGS.checkout_ttl_minutes} phút khi đã sang bước thanh toán.`,
      "Đơn chưa thanh toán sau 30 phút sẽ tự huỷ và nhả đồ cho khách khác.",
    ],
  },
  {
    id: "thanh-toan",
    title: "Thanh toán & tiền cọc",
    items: [
      "Tiền cọc tách riêng khỏi tiền thuê và được hoàn lại sau khi kiểm tra đồ.",
      `Cọc giữ chỗ: trả trước tiền cọc + ${Math.round(SETTINGS.prepay_rental_rate * 100)}% tiền thuê.`,
      `Trả đủ ngay: giảm thêm ${Math.round(SETTINGS.full_payment_discount * 100)}% tiền thuê.`,
      "Mã giảm giá chỉ áp lên tiền thuê, không áp lên tiền cọc.",
      "Hoàn tiền online về đúng kênh đã thanh toán trong 3–7 ngày làm việc.",
    ],
  },
  {
    id: "huy-don",
    title: "Huỷ đơn & hoàn tiền",
    items: [
      "Huỷ trước ngày nhận từ 7 ngày: hoàn 100% tiền thuê đã trả.",
      "Huỷ trước 3–6 ngày: hoàn 70% tiền thuê đã trả.",
      "Huỷ trước 1–2 ngày: hoàn 50% tiền thuê đã trả.",
      "Huỷ trong vòng 24 giờ hoặc không đến nhận: không hoàn tiền thuê.",
      "Tiền cọc luôn được hoàn 100% trong mọi trường hợp huỷ.",
      "Nếu shop huỷ đơn vì lý do từ phía shop: hoàn 100% mọi khoản và tặng voucher xin lỗi.",
    ],
  },
  {
    id: "tra-do",
    title: "Trả đồ & phí phát sinh",
    items: CONDITION_FEES.map((f) => `${f.condition}: ${f.fee}.`),
  },
  {
    id: "gia-han",
    title: "Gia hạn",
    items: [
      "Gửi yêu cầu gia hạn trước hạn trả ít nhất 12 giờ.",
      "Hệ thống tự duyệt nếu món đó chưa có khách đặt trong khoảng gia hạn (đã tính cả thời gian giặt ủi).",
      "Tiền gia hạn tính theo giá ngày thuê thêm và thu ngay khi được duyệt.",
    ],
  },
  {
    id: "danh-gia",
    title: "Đánh giá",
    items: [
      "Chỉ đơn đã hoàn tất mới được đánh giá, mỗi sản phẩm một lần trong vòng 30 ngày.",
      "Đánh giá và hình ảnh được kiểm duyệt trước khi hiển thị công khai.",
    ],
  },
];

export const GUIDE_STEPS = [
  {
    title: "Trước khi đặt",
    body: "Điền số đo trong hồ sơ để shop gợi ý size và soạn cá thể vừa người nhất. Nếu cần sửa vừa người, hãy chừa thêm 1 ngày trước sự kiện.",
  },
  {
    title: "Khi nhận đồ",
    body: "Cùng nhân viên kiểm tra biên bản lúc giao: ảnh tình trạng, phụ kiện đi kèm, mã cá thể. Đây là căn cứ khách quan khi trả đồ.",
  },
  {
    title: "Trong lúc thuê",
    body: "Đừng tự giặt tẩy hay sửa chữa. Nếu có sự cố, chụp ảnh và báo shop ngay để được hướng dẫn.",
  },
  {
    title: "Khi trả đồ",
    body: "Trả đủ món và phụ kiện. Nhân viên quét mã từng cá thể, lập biên bản kiểm tra và quyết toán cọc ngay sau đó.",
  },
];
