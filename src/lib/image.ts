import imageCompression from 'browser-image-compression'

export async function compressImage(file: File): Promise<Blob> {
  return imageCompression(file, {
    maxWidthOrHeight: 1200,
    maxSizeMB: 0.15,
    fileType: 'image/webp',
    useWebWorker: true,
  })
}
