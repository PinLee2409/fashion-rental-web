import type { ProductImage, Review } from "@/lib/types";
import { PRODUCTS } from "./products";

function photo(slug: string, index: number, alt: string): ProductImage {
  const product = PRODUCTS.find((p) => p.slug === slug);
  const tone = product?.images[index % (product?.images.length || 1)]?.tone ?? ["#c9bda6", "#f3efe6"];
  return { id: `${slug}-review-${index}`, motif: "still-life", tone, alt };
}

/**
 * BR-60 — chỉ khách có đơn `completed` chứa sản phẩm đó mới được đánh giá.
 * BR-61 — đánh giá qua kiểm duyệt trước khi hiển thị (`status`).
 */
export const REVIEWS: Review[] = [
  {
    id: "rv-01",
    productSlug: "ao-dai-cach-tan-do-theu-sen",
    orderCode: "CR20260712-0031",
    author: "Trần Mỹ Duyên",
    rating: 5,
    content:
      "Thêu tay rất sắc, màu đỏ lên ảnh đúng như hình. Mình cao 1m60 nặng 48kg mặc size S hơi rộng vai một chút nên đổi qua XS thì vừa. Shop giao đúng hẹn, đồ đã ủi phẳng.",
    createdAt: "2026-07-18T10:12:00+07:00",
    sizeWorn: "S",
    heightCm: 160,
    photos: [photo("ao-dai-cach-tan-do-theu-sen", 0, "Ảnh khách gửi — áo dài đỏ")],
    status: "approved",
    reply: {
      content: "Cảm ơn Duyên đã chia sẻ số đo, shop đã ghi chú để lần sau gợi ý size chuẩn hơn nhé.",
      at: "2026-07-19T09:00:00+07:00",
    },
  },
  {
    id: "rv-02",
    productSlug: "ao-dai-cach-tan-do-theu-sen",
    orderCode: "CR20260620-0018",
    author: "Lê Ngọc Hân",
    rating: 4,
    content:
      "Chất lụa mát, mặc cả ngày đám hỏi không bí. Trừ nửa sao vì quần lụa hơi dài với người 1m55, nhưng shop có kẹp lai giúp tại quầy.",
    createdAt: "2026-06-25T16:40:00+07:00",
    sizeWorn: "M",
    heightCm: 155,
    photos: [],
    status: "approved",
  },
  {
    id: "rv-03",
    productSlug: "ao-dai-cach-tan-do-theu-sen",
    orderCode: "CR20260530-0009",
    author: "Phạm Thu Trang",
    rating: 5,
    content:
      "Thuê 3 ngày mà giá gói rẻ hơn tính lẻ tận 150k. Trả đồ xong hai hôm là được hoàn cọc đầy đủ, rất rõ ràng.",
    createdAt: "2026-06-02T20:05:00+07:00",
    sizeWorn: "M",
    heightCm: 162,
    photos: [photo("ao-dai-cach-tan-do-theu-sen", 1, "Ảnh khách gửi — chi tiết thêu sen")],
    status: "approved",
  },
  {
    id: "rv-04",
    productSlug: "dam-da-hoi-satin-midnight",
    orderCode: "CR20260805-0044",
    author: "Vũ Hà My",
    rating: 5,
    content:
      "Satin dày, đứng form, không lộ nội y. Đi gala công ty được hỏi mua ở đâu suốt buổi. Gọng ngực ôm chắc nên nhảy thoải mái.",
    createdAt: "2026-08-09T22:15:00+07:00",
    sizeWorn: "S",
    heightCm: 166,
    photos: [photo("dam-da-hoi-satin-midnight", 0, "Ảnh khách gửi — đầm satin xanh đêm")],
    status: "approved",
  },
  {
    id: "rv-05",
    productSlug: "dam-da-hoi-satin-midnight",
    orderCode: "CR20260726-0036",
    author: "Đinh Bảo Châu",
    rating: 4,
    content:
      "Màu xanh đêm dưới đèn vàng hơi ngả tím, mình thấy đẹp hơn cả ảnh. Chỉ lưu ý khoá kéo sau lưng cần người hỗ trợ.",
    createdAt: "2026-07-30T18:02:00+07:00",
    sizeWorn: "M",
    heightCm: 170,
    photos: [],
    status: "approved",
  },
  {
    id: "rv-06",
    productSlug: "vay-cuoi-ren-phap-tay-phong",
    orderCode: "CR20260614-0012",
    author: "Nguyễn Thanh Vân",
    rating: 5,
    content:
      "Ren Pháp đính tay nhìn tận nơi rất khác ảnh chụp. Chỉ có một bộ nên mình đặt trước 2 tháng, shop giữ lịch đúng hẹn. Tay phồng tháo rời rất tiện lúc đãi tiệc.",
    createdAt: "2026-06-20T11:30:00+07:00",
    sizeWorn: "M",
    heightCm: 164,
    photos: [photo("vay-cuoi-ren-phap-tay-phong", 0, "Ảnh khách gửi — váy cưới ren")],
    status: "approved",
    reply: {
      content: "Chúc mừng hạnh phúc của Vân! Cảm ơn bạn đã giữ gìn váy rất cẩn thận.",
      at: "2026-06-21T08:30:00+07:00",
    },
  },
  {
    id: "rv-07",
    productSlug: "vest-nam-navy-may-do",
    orderCode: "CR20260818-0051",
    author: "Hoàng Minh Quân",
    rating: 4,
    content:
      "Dáng slim nên vai 44 như mình phải lên size L. Vải dày dặn, không bóng rẻ tiền. Đi ăn hỏi buổi trưa hơi nóng nhưng chấp nhận được.",
    createdAt: "2026-08-22T09:48:00+07:00",
    sizeWorn: "L",
    heightCm: 175,
    photos: [],
    status: "approved",
  },
  {
    id: "rv-08",
    productSlug: "vest-nam-navy-may-do",
    orderCode: "CR20260710-0027",
    author: "Đỗ Trung Kiên",
    rating: 5,
    content: "Thuê vest rẻ hơn mua nhiều, mà mỗi dịp lại đổi được màu khác. Lần này navy, lần sau thử ghi.",
    createdAt: "2026-07-14T13:20:00+07:00",
    sizeWorn: "M",
    heightCm: 172,
    photos: [photo("vest-nam-navy-may-do", 0, "Ảnh khách gửi — vest navy")],
    status: "approved",
  },
  {
    id: "rv-09",
    productSlug: "dam-hoa-maxi-vuon-xuan",
    orderCode: "CR20260822-0056",
    author: "Ngô Phương Anh",
    rating: 4,
    content:
      "Voan nhẹ, đi tiệc cưới ngoài trời rất mát. Có dây rút eo nên người gầy như mình vẫn ôm được. Vết trà mình làm đổ được shop báo phí giặt 100k, rất minh bạch.",
    createdAt: "2026-08-28T19:10:00+07:00",
    sizeWorn: "S",
    heightCm: 158,
    photos: [photo("dam-hoa-maxi-vuon-xuan", 0, "Ảnh khách gửi — đầm hoa maxi")],
    status: "approved",
  },
  {
    id: "rv-10",
    productSlug: "dam-nhung-cocktail-ruou-vang",
    orderCode: "CR20260801-0040",
    author: "Trịnh Khánh Ly",
    rating: 4,
    content: "Nhung mềm, không bám xơ. Màu rượu vang hợp da nâu. Mình thuê 1 ngày đi sinh nhật là vừa đủ.",
    createdAt: "2026-08-04T21:00:00+07:00",
    sizeWorn: "M",
    heightCm: 161,
    photos: [],
    status: "approved",
  },
  {
    id: "rv-11",
    productSlug: "ao-dai-lua-ngu-sac-ngoc-trai",
    orderCode: "CR20260728-0038",
    author: "Bùi Thuỳ Dương",
    rating: 5,
    content:
      "Lụa đổi màu dưới đèn thật, ảnh cưới lên rất có chiều sâu. Ngọc trai ở cửa tay còn nguyên vẹn khi mình trả.",
    createdAt: "2026-08-01T15:25:00+07:00",
    sizeWorn: "S",
    heightCm: 163,
    photos: [photo("ao-dai-lua-ngu-sac-ngoc-trai", 0, "Ảnh khách gửi — áo dài lụa ngũ sắc")],
    status: "approved",
  },
  {
    id: "rv-12",
    productSlug: "tuxedo-den-ve-satin",
    orderCode: "CR20260705-0022",
    author: "Lý Gia Bảo",
    rating: 5,
    content: "Ve satin bản vừa, không quá điệu. Kèm nơ nên khỏi mua thêm. Đúng chuẩn black-tie.",
    createdAt: "2026-07-09T08:55:00+07:00",
    sizeWorn: "L",
    heightCm: 178,
    photos: [],
    status: "approved",
  },
  {
    id: "rv-13",
    productSlug: "trench-coat-oversized-be",
    orderCode: "CR20260815-0049",
    author: "Mai Hải Yến",
    rating: 5,
    content: "Thuê đi chụp ảnh Đà Lạt 4 ngày. Dáng rộng khoác ngoài đầm dài rất hợp, vai không bị xệ.",
    createdAt: "2026-08-21T12:40:00+07:00",
    sizeWorn: "M",
    heightCm: 165,
    photos: [photo("trench-coat-oversized-be", 0, "Ảnh khách gửi — trench coat be")],
    status: "approved",
  },
  {
    id: "rv-14",
    productSlug: "clutch-ngoc-trai-da-tiec",
    orderCode: "CR20260824-0058",
    author: "Trần Mỹ Duyên",
    rating: 4,
    content: "Nhỏ gọn, vừa iPhone và son. Khung kim loại chắc. Thuê kèm đầm nên không mất thêm phí giao.",
    createdAt: "2026-08-27T17:05:00+07:00",
    sizeWorn: "Free",
    photos: [],
    status: "approved",
  },
  {
    id: "rv-15",
    productSlug: "do-bieu-dien-anh-kim",
    orderCode: "CR20260620-0016",
    author: "CLB Nghệ thuật Sóng Trẻ",
    rating: 5,
    content:
      "Thuê 6 bộ cho tiết mục nhảy, bắt đèn rất tốt. Có 2 viên đá bị bong, shop kiểm tra và không tính phí vì hao mòn tự nhiên.",
    createdAt: "2026-06-27T22:30:00+07:00",
    sizeWorn: "M",
    photos: [photo("do-bieu-dien-anh-kim", 0, "Ảnh khách gửi — trang phục biểu diễn")],
    status: "approved",
  },
  {
    // Đánh giá do chính khách hàng đang đăng nhập viết
    id: "rv-mine-01",
    productSlug: "ao-dai-lua-ngu-sac-ngoc-trai",
    orderCode: "CR20260728-0038",
    author: "Nguyễn Khánh Linh",
    rating: 5,
    content:
      "Mình thuê đi lễ ăn hỏi của chị gái. Lụa mát, đứng dáng, và quan trọng là shop giao đúng hẹn nên không bị cuống buổi sáng hôm đó. Trả đồ xong 2 ngày là được hoàn đủ cọc.",
    createdAt: "2026-08-06T09:20:00+07:00",
    sizeWorn: "S",
    heightCm: 163,
    photos: [],
    status: "approved",
  },
  {
    id: "rv-16",
    productSlug: "set-linen-mua-he",
    orderCode: "CR20260810-0046",
    author: "Phan Quỳnh Như",
    rating: 4,
    content: "Linen nhăn nhẹ đúng như shop mô tả, mình thấy đó là nét riêng. Đi biển Phú Quốc 5 ngày rất tiện.",
    createdAt: "2026-08-18T10:15:00+07:00",
    sizeWorn: "S",
    heightCm: 159,
    photos: [],
    status: "approved",
  },
];

/** Đánh giá chờ kiểm duyệt — BR-61 */
REVIEWS.push(
  {
    id: "rv-pending-01",
    productSlug: "dam-da-hoi-satin-midnight",
    orderCode: "CR20260901-0044",
    author: "Vũ Hà My",
    rating: 5,
    content:
      "Đầm lên dáng rất đẹp, mình cao 1m66 nặng 52kg mặc size S vừa in. Có gửi kèm ảnh chụp ở gala công ty.",
    createdAt: new Date(Date.now() - 20 * 3600_000).toISOString(),
    sizeWorn: "S",
    heightCm: 166,
    photos: [],
    status: "pending",
  },
  {
    id: "rv-pending-02",
    productSlug: "vest-nam-navy-may-do",
    orderCode: "CR20260830-0051",
    author: "Hoàng Minh Quân",
    rating: 3,
    content:
      "Vest ổn nhưng lần này giao trễ 2 tiếng so với hẹn, hơi cập rập vì mình cần đi tiệc ngay buổi tối.",
    createdAt: new Date(Date.now() - 44 * 3600_000).toISOString(),
    sizeWorn: "M",
    heightCm: 172,
    photos: [],
    status: "pending",
  },
);

export function reviewsForProduct(slug: string): Review[] {
  return REVIEWS.filter((r) => r.productSlug === slug && r.status === "approved");
}

export function ratingBreakdown(slug: string): { stars: number; count: number; ratio: number }[] {
  const list = reviewsForProduct(slug);
  return [5, 4, 3, 2, 1].map((stars) => {
    const count = list.filter((r) => r.rating === stars).length;
    return { stars, count, ratio: list.length ? count / list.length : 0 };
  });
}

/** Đánh giá nổi bật dùng ở trang chủ. */
export const FEATURED_REVIEWS = ["rv-06", "rv-04", "rv-09", "rv-08"]
  .map((id) => REVIEWS.find((r) => r.id === id)!)
  .filter(Boolean);
