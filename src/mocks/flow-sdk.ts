// Mock Flow SDK for local development

export interface MediaItem {
  mediaId: string;
  base64: string;      // Raw base64 data without data: prefix
  mimeType: string;    // e.g. 'image/jpeg'
  type: 'image' | 'video' | 'audio';
  name: string;
}

export interface ImageGenerateOptions {
  prompt: string;
  referenceImageMediaIds?: string[];
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  modelDisplayName: string;
}

// A standard 1x1 pixel red GIF placeholder
const RED_DOT_BASE64 = 'R0lGODlhAQABAIABAP///wAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

export const Flow = {
  media: {
    select: async (options?: { filter?: 'image' | 'video' | 'audio' | 'all' }): Promise<MediaItem> => {
      console.log('[Mock Flow SDK] select called with options:', options);
      return {
        mediaId: 'mock-media-id-' + Math.random().toString(36).substr(2, 9),
        base64: RED_DOT_BASE64,
        mimeType: 'image/gif',
        type: 'image',
        name: 'mock_image.gif'
      };
    },
    selectMultiple: async (options?: { maxCount?: number; filter?: string }): Promise<MediaItem[]> => {
      console.log('[Mock Flow SDK] selectMultiple called with options:', options);
      const count = options?.maxCount || 1;
      const items: MediaItem[] = [];
      for (let i = 0; i < count; i++) {
        items.push({
          mediaId: `mock-media-id-${i}-${Math.random().toString(36).substr(2, 9)}`,
          base64: RED_DOT_BASE64,
          mimeType: 'image/gif',
          type: 'image',
          name: `mock_image_${i}.gif`
        });
      }
      return items;
    }
  },
  
  save: async (params: { base64: string; mimeType: string; name: string }): Promise<void> => {
    console.log('[Mock Flow SDK] save called with:', params);
  },
  
  upload: async (params: { base64: string; mimeType: string; name: string }): Promise<{ mediaId: string }> => {
    console.log('[Mock Flow SDK] upload called with size:', params.base64.length);
    return {
      mediaId: 'uploaded-mock-id-' + Math.random().toString(36).substr(2, 9)
    };
  },
  
  download: async (params: { base64: string; mimeType: string; filename: string }): Promise<void> => {
    console.log('[Mock Flow SDK] download called for:', params.filename);
    const link = document.createElement('a');
    link.href = `data:${params.mimeType};base64,${params.base64}`;
    link.download = params.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  
  generate: {
    image: async (options: ImageGenerateOptions): Promise<{ base64: string; mimeType: string; mediaId: string }> => {
      console.log('[Mock Flow SDK] generate.image called with:', options);
      // Wait 1 second to simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return a slightly larger placeholder - a 100x100 dark blue GIF to simulate output
      const BLUE_BOX_BASE64 = 'R0lGODlhZABkAHAAACH5BAEAAAAALAAAAABkAGQAhAAAAAAAAAMGLcrRY/7gYwK02OrNuf9goIWiSJbmqa7mub7nCc/2PN/3jef7vvf/A8YhKAA7';
      
      return {
        base64: BLUE_BOX_BASE64,
        mimeType: 'image/gif',
        mediaId: 'generated-mock-id-' + Math.random().toString(36).substr(2, 9)
      };
    },
    
    video: async (options: any): Promise<{ base64: string; mimeType: string; mediaId: string }> => {
      console.log('[Mock Flow SDK] generate.video called with:', options);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        base64: '',
        mimeType: 'video/mp4',
        mediaId: 'generated-mock-video-id'
      };
    },
    
    text: async (prompt: string, _options?: any): Promise<string> => {
      console.log('[Mock Flow SDK] generate.text called with prompt:', prompt);
      return 'Mocked Gemini response for: ' + prompt;
    }
  }
};
