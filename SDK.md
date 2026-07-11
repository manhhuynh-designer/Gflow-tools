# Flow SDK Documentation for Flow Tools

Flow SDK là thư viện cốt lõi để các Flow Tool giao tiếp với host (Google Flow) nhằm thực hiện chọn media, lưu trữ, tải xuống và tạo nội dung bằng AI.

## 1. Cài đặt & Import

Trong môi trường Flow, bạn không cần cài đặt qua npm. Sử dụng import trực tiếp từ `esm.sh` (được host tự động resolve):

```typescript
import { Flow } from 'flow-sdk';
```

## 2. Các Interface chính (TypeScript)

```typescript
interface MediaItem {
  mediaId: string;
  base64: string;      // Dữ liệu base64 thô (không có tiền tố data:)
  mimeType: string;    // e.g., 'image/jpeg', 'video/mp4'
  type: 'image' | 'video' | 'audio';
  name: string;
}

interface ImageGenerateOptions {
  prompt: string;
  referenceImageMediaIds?: string[]; // MediaId từ Flow.media.select hoặc Flow.upload
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  modelDisplayName: string; // BẮT BUỘC. Ví dụ: '🍌 Nano Banana Pro'
}

interface VideoGenerateOptions {
  prompt: string;
  firstFrameImageMediaId?: string;
  lastFrameImageMediaId?: string;
  referenceImageMediaIds?: string[];
  sourceVideoMediaId?: string;
  sourceVideoMode?: 'edit';
  aspectRatio?: '16:9' | '9:16';
  modelDisplayName: string; // BẮT BUỘC. Ví dụ: 'Omni Flash'
  durationSeconds?: number;
}
```

## 3. Các API chính

### Media Selection
- `Flow.media.select({ filter?: 'image' | 'video' | 'audio' | 'all' })`: Chọn 1 file.
- `Flow.media.selectMultiple({ maxCount?: number, filter?: string })`: Chọn nhiều file.

### Persistence (Lưu trữ)
- `Flow.save({ base64, mimeType, name })`: Lưu ảnh/video vào Media Gallery của người dùng.
- `Flow.upload({ base64, mimeType, name })`: Tải dữ liệu lên để lấy `mediaId` dùng cho AI Generation (không hiện trong gallery).
- `Flow.download({ base64, mimeType, filename })`: **BẮT BUỘC** để tải file về máy tính (các phương pháp web chuẩn bị chặn).

### AI Generation
- `Flow.generate.image(options)`: Trả về `{ base64, mimeType, mediaId }`. Tự động lưu vào Gallery.
- `Flow.generate.video(options)`: Trả về `{ base64, mimeType, mediaId }`. Tự động lưu vào Gallery.
- `Flow.generate.text(prompt, options)`: Sử dụng Gemini để xử lý văn bản hoặc phân tích đa phương thức.

## 4. Danh sách Model khả dụng (User Tier: Ultra)

### Image Models
- `🍌 Nano Banana Pro` (Default)
- `🍌 Nano Banana 2`
- `🍌 Nano Banana 2 Lite`

### Video Models
- `Omni Flash` (Default, hỗ trợ V2V Edit)
- `Veo 3.1 - Lite`
- `Veo 3.1 - Fast`
- `Veo 3.1 - Quality`

## 5. Quy tắc quan trọng
1. **MIME Types**: Luôn sử dụng `media.mimeType` từ SDK, không fix cứng (e.g. `data:${media.mimeType};base64,...`).
2. **MediaId**: AI Generation chỉ nhận `mediaId`, không nhận base64 trực tiếp.
3. **Download**: Luôn dùng `Flow.download()`. `window.open` hoặc thẻ `<a>` sẽ bị sandbox chặn.
4. **Loading States**: Luôn hiển thị UI loading khi gọi `Flow.generate` vì video có thể mất 1-3 phút.