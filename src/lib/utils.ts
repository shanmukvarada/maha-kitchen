export const convertGoogleDriveLink = (url: string): string => {
  if (!url) return '';
  
  // Check if it's a Google Drive link
  if (url.includes('drive.google.com')) {
    // Extract file ID
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }
  }
  
  return url;
};
