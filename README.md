# Fashion Rental Web

Monorepo cho nền tảng cho thuê thời trang. Gồm 2 ứng dụng Next.js độc lập:

| Thư mục | Ứng dụng | Mô tả |
| --- | --- | --- |
| [`frontend/`](frontend) | Customer web | Giao diện người dùng cuối: duyệt, thuê, đặt hàng |
| [`frontend-admin/`](frontend-admin) | Admin / Operations | Vận hành: đơn thuê, lịch bận, kho cá thể, nhận trả, duyệt phí, báo cáo |

## Bản demo trực tuyến

| Giao diện | Địa chỉ |
| --- | --- |
| Khách hàng | https://pinlee2409.github.io/fashion-rental-web/ |
| Vận hành | https://pinlee2409.github.io/fashion-rental-web/admin/ |

Đăng nhập trang vận hành bằng tài khoản mẫu hiện sẵn trên màn hình đăng nhập, mật khẩu chung `stylerent`.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router)
- React 19 + TypeScript 5
- Tailwind CSS 4
- ESLint 9 (`eslint-config-next`)

## Yêu cầu

- Node.js >= 20
- npm >= 10

## Chạy dự án

Mỗi app cài dependency riêng.

```bash
# Customer web -> http://localhost:3000
cd frontend
npm install
npm run dev
```

```bash
# Admin dashboard -> http://localhost:3001
cd frontend-admin
npm install
npm run dev -- --port 3001
```

> Chạy song song 2 app thì nhớ đổi port cho app thứ hai, mặc định Next dùng 3000.

## Scripts (giống nhau ở cả 2 app)

| Lệnh | Tác dụng |
| --- | --- |
| `npm run dev` | Chạy dev server |
| `npm run build` | Build production |
| `npm run start` | Chạy bản đã build |
| `npm run lint` | Kiểm tra ESLint |

## Biến môi trường

Copy `.env.example` thành `.env.local` trong từng app rồi điền giá trị thật.
File `.env*` đã được gitignore, không commit secret lên repo.

## Deploy

[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) tự chạy mỗi khi đẩy lên `main`: build tĩnh cả hai app rồi gom thành một site — app khách ở gốc, app vận hành ở `/admin`.

Bản deploy bật `output: "export"` qua biến môi trường nên `npm run dev` ở máy không đổi gì. Muốn dựng thử bản tĩnh:

```bash
cd frontend
STATIC_EXPORT=true NEXT_PUBLIC_BASE_PATH=/fashion-rental-web npm run build   # kết quả trong out/
```

Vì là site tĩnh, mọi route động phải khai báo `generateStaticParams`, và `trailingSlash` được bật để GitHub Pages phục vụ theo thư mục.

## Cấu trúc

```
fashion-rental-web/
├── frontend/           # app khách hàng
│   ├── app/            # App Router (layout, page, globals.css)
│   └── public/
├── frontend-admin/     # app quản trị
│   ├── app/
│   └── public/
├── .github/workflows/  # build & deploy GitHub Pages
├── .editorconfig
├── .gitattributes
└── .gitignore
```
