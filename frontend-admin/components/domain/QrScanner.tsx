"use client";

import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconAlert, IconCamera, IconCameraOff, IconCheck, IconScan, IconSwap } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { Callout } from "@/components/ui/Primitives";
import { cn } from "@/lib/utils";

/** Độ phân giải tối đa đưa vào bộ giải mã — càng nhỏ càng đỡ tốn CPU của máy quầy. */
const DECODE_WIDTH = 480;
/** Chống quét trùng: cùng một mã trong khoảng này chỉ tính một lần. */
const REPEAT_MS = 1600;

type ScanState = "starting" | "running" | "error";

function describeError(err: unknown): string {
  const name = (err as { name?: string })?.name ?? "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Trình duyệt đang chặn camera. Bấm vào biểu tượng khoá trên thanh địa chỉ và cho phép camera, sau đó mở lại.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "Không tìm thấy camera nào trên thiết bị này. Dùng đầu đọc mã vạch hoặc nhập mã bằng tay.";
  }
  if (name === "NotReadableError") {
    return "Camera đang được ứng dụng khác sử dụng. Đóng ứng dụng đó rồi thử lại.";
  }
  return "Không mở được camera. Dùng đầu đọc mã vạch hoặc nhập mã bằng tay.";
}

/**
 * Quét mã QR bằng camera thiết bị (UC-11, UC-13).
 *
 * Luồng hình đi qua canvas ẩn rồi vào jsQR mỗi khung hình. Máy quầy thường
 * dùng đầu đọc mã vạch cắm USB — đầu đọc gõ thẳng vào ô nhập nên ô "nhập mã
 * bằng tay" bên dưới vẫn giữ nguyên, đây chỉ là đường vào thứ hai cho điện
 * thoại và tablet.
 *
 * Lưu ý triển khai: getUserMedia chỉ chạy trên HTTPS hoặc localhost.
 */
export function ScanDialog({
  open,
  onClose,
  onDetect,
  title = "Quét mã QR",
  hint,
  continuous = false,
}: {
  open: boolean;
  onClose: () => void;
  /** Nhận chuỗi trong mã QR, đã cắt khoảng trắng. */
  onDetect: (value: string) => void;
  title?: string;
  hint?: string;
  /** Giữ camera bật sau mỗi lần quét — dùng cho quầy nhận trả nhiều món. */
  continuous?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef(0);
  const lastRef = useRef({ code: "", at: 0 });

  const [state, setState] = useState<ScanState>("starting");
  const [error, setError] = useState("");
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [caught, setCaught] = useState<string[]>([]);
  const [manual, setManual] = useState("");

  // Callback của cha thường là arrow inline nên đổi định danh mỗi lần render.
  // Giữ qua ref để effect mở camera không bị khởi động lại sau mỗi render.
  const handlers = useRef({ onDetect, onClose, continuous });
  useEffect(() => {
    handlers.current = { onDetect, onClose, continuous };
  });

  const emit = useCallback((raw: string) => {
    const value = raw.trim();
    if (!value) return;
    const now = Date.now();
    if (lastRef.current.code === value && now - lastRef.current.at < REPEAT_MS) return;
    lastRef.current = { code: value, at: now };

    navigator.vibrate?.(40);
    setCaught((prev) => [value, ...prev.filter((c) => c !== value)].slice(0, 6));
    handlers.current.onDetect(value);
    if (!handlers.current.continuous) handlers.current.onClose();
  }, []);

  /* ------------------------------------------------ vòng đời luồng camera -- */
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    // Giữ tham chiếu tại thời điểm effect chạy — lúc cleanup thì ref có thể đã đổi.
    const videoEl = videoRef.current;

    async function start() {
      setState("starting");
      setError("");

      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setState("error");
        setError(
          window.isSecureContext === false
            ? "Camera chỉ bật được trên kết nối HTTPS hoặc localhost. Bản triển khai thật cần chạy dưới HTTPS."
            : "Trình duyệt này không hỗ trợ mở camera. Nhập mã bằng tay ở ô bên dưới.",
        );
        return;
      }

      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = list.filter((d) => d.kind === "videoinput");
        const target = videoInputs[cameraIndex];

        const stream = await navigator.mediaDevices.getUserMedia({
          video: target?.deviceId
            ? { deviceId: { exact: target.deviceId } }
            : { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }

        // Nhãn thiết bị chỉ lộ ra sau khi người dùng đã cấp quyền.
        const labelled = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
        if (!cancelled) setCameras(labelled);

        if (!cancelled) setState("running");
        tick();
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setError(describeError(err));
      }
    }

    function tick() {
      frameRef.current = requestAnimationFrame(tick);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || !video.videoWidth) return;

      const scale = Math.min(1, DECODE_WIDTH / video.videoWidth);
      const w = Math.round(video.videoWidth * scale);
      const h = Math.round(video.videoHeight * scale);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      const image = ctx.getImageData(0, 0, w, h);
      const found = jsQR(image.data, w, h, { inversionAttempts: "dontInvert" });
      if (found?.data) emit(found.data);
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoEl) videoEl.srcObject = null;
    };
  }, [open, cameraIndex, emit]);

  // Mở lại thì xoá danh sách đã quét của lượt trước.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset khi hộp thoại mở lại
      setCaught([]);
      lastRef.current = { code: "", at: 0 };
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={hint ?? "Đưa tem QR trên cá thể vào khung hình. Mã đọc được sẽ tự điền vào phiếu."}
      width="max-w-[520px]"
      elevated
      footer={
        <>
          {cameras.length > 1 && (
            <button
              type="button"
              onClick={() => setCameraIndex((i) => (i + 1) % cameras.length)}
              className="btn btn-outline btn-sm mr-auto gap-1.5"
            >
              <IconSwap width={14} height={14} />
              Đổi camera
            </button>
          )}
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            {continuous ? "Xong" : "Đóng"}
          </button>
        </>
      }
    >
      <div className="space-y-3.5">
        {/* --------------------------------------------------- khung hình -- */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-ink">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={cn("h-full w-full object-cover", state !== "running" && "opacity-0")}
          />
          <canvas ref={canvasRef} className="hidden" />

          {state === "running" && (
            <>
              {/* Khung ngắm giữa màn hình */}
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="relative h-[58%] w-[58%]">
                  <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-white/85" />
                  <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-white/85" />
                  <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-white/85" />
                  <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-white/85" />
                  <span className="a-scanline absolute inset-x-0 top-0 h-[2px] bg-white/70" />
                </div>
              </div>
              <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded bg-ink/70 px-2 py-1 text-[11px] text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Đang quét
              </span>
            </>
          )}

          {state === "starting" && (
            <div className="absolute inset-0 grid place-items-center text-white/70">
              <div className="text-center">
                <IconCamera width={22} height={22} className="mx-auto" />
                <p className="mt-2 text-[12.5px]">Đang xin quyền truy cập camera…</p>
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="absolute inset-0 grid place-items-center px-6 text-white/70">
              <div className="text-center">
                <IconCameraOff width={22} height={22} className="mx-auto" />
                <p className="mt-2 text-[12.5px]">Camera chưa sẵn sàng</p>
              </div>
            </div>
          )}
        </div>

        {state === "error" && (
          <Callout tone="warning" icon={<IconAlert width={15} height={15} />}>
            {error}
          </Callout>
        )}

        {/* ------------------------------------------------ nhập tay / đầu đọc -- */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!manual.trim()) return;
            emit(manual);
            setManual("");
          }}
        >
          <label className="field-label" htmlFor="scan-manual">
            Hoặc nhập mã / dùng đầu đọc mã vạch
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <IconScan
                width={15}
                height={15}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3"
              />
              <input
                id="scan-manual"
                value={manual}
                onChange={(e) => setManual(e.target.value.toUpperCase())}
                placeholder="AD-M-DO-003"
                className="field num pl-8"
              />
            </div>
            <button type="submit" disabled={!manual.trim()} className="btn btn-sm">
              Nhận mã
            </button>
          </div>
        </form>

        {continuous && caught.length > 0 && (
          <div className="rounded-md border border-line bg-surface-2 p-3">
            <p className="label-xs mb-1.5">Đã quét trong lượt này</p>
            <ul className="flex flex-wrap gap-1.5">
              {caught.map((code) => (
                <li
                  key={code}
                  className="num inline-flex items-center gap-1.5 rounded bg-success-soft px-2 py-1 text-[11.5px] text-success"
                >
                  <IconCheck width={11} height={11} />
                  {code}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}

/** Nút mở camera đặt cạnh ô nhập mã. */
export function ScanButton({
  onClick,
  label = "Quét bằng camera",
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button type="button" onClick={onClick} title={label} className={cn("btn btn-outline btn-sm gap-1.5", className)}>
      <IconCamera width={14} height={14} />
      <span className="hidden sm:inline">Camera</span>
    </button>
  );
}
