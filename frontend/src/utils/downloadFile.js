/**
 * Centralized Blob File Downloader for Central Bank of India (PAPG)
 */
export const downloadBlobFile = ({
  response,
  fileName = 'download',
  fallbackType = 'application/octet-stream',
}) => {
  try {
    const blob = new Blob([response?.data ?? response], {
      type: response?.headers?.['content-type'] ?? fallbackType,
    });

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('[FILE_DOWNLOAD_ERROR]', error);
    throw error;
  }
};

export default downloadBlobFile;
