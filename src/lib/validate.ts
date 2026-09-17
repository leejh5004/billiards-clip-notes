export function photoMissing(image: Blob | null | undefined): boolean {
  return !image || image.size === 0;
}
