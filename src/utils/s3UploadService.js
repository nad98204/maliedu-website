const MULTIPART_API_BASE = "/api/s3-multipart";

const requestJson = async (path, payload) => {
  const response = await fetch(`${MULTIPART_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Upload request failed: ${response.status}`);
  }

  return data;
};

const uploadPart = (url, blob, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", url, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag") || xhr.getResponseHeader("etag");

        if (!etag) {
          reject(
            new Error(
              "S3 upload succeeded but ETag was not exposed. Check S3 CORS ExposeHeaders.",
            ),
          );
          return;
        }

        resolve(etag);
        return;
      }

      reject(new Error(`Upload part failed with status ${xhr.status}`));
    };

    xhr.onerror = () => {
      reject(new Error("Upload part failed due to a network error"));
    };

    xhr.onabort = () => {
      reject(new Error("Upload part was aborted"));
    };

    xhr.send(blob);
  });

const uploadObjectToS3 = async (
  file,
  onProgress,
  { folder = "files", fallbackContentType = "application/octet-stream" } = {},
) => {
  if (!file) {
    throw new Error("Khong tim thay file de tai len.");
  }

  if (!file.size) {
    throw new Error("Khong ho tro upload file rong.");
  }

  let uploadSession = null;

  try {
    if (onProgress) {
      onProgress(0);
    }

    uploadSession = await requestJson("/init", {
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || fallbackContentType,
      folder,
    });

    const totalParts = Math.ceil(file.size / uploadSession.partSize);
    const partProgress = new Map();
    const completedParts = [];

    const reportProgress = () => {
      if (!onProgress) {
        return;
      }

      const uploadedBytes = Array.from(partProgress.values()).reduce(
        (total, value) => total + value,
        0,
      );
      const percent = Math.min(
        99,
        Math.round((uploadedBytes / file.size) * 100),
      );

      onProgress(percent);
    };

    for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
      const start = (partNumber - 1) * uploadSession.partSize;
      const end = Math.min(file.size, start + uploadSession.partSize);
      const blob = file.slice(start, end);
      const { url } = await requestJson("/sign-part", {
        key: uploadSession.key,
        uploadId: uploadSession.uploadId,
        partNumber,
      });
      const etag = await uploadPart(url, blob, (loadedBytes) => {
        partProgress.set(partNumber, loadedBytes);
        reportProgress();
      });

      partProgress.set(partNumber, blob.size);
      completedParts.push({
        PartNumber: partNumber,
        ETag: etag,
      });
      reportProgress();
    }

    const completedUpload = await requestJson("/complete", {
      key: uploadSession.key,
      uploadId: uploadSession.uploadId,
      parts: completedParts,
    });

    if (onProgress) {
      onProgress(100);
    }

    return completedUpload.publicUrl || uploadSession.publicUrl;
  } catch (error) {
    if (uploadSession?.key && uploadSession?.uploadId) {
      requestJson("/abort", {
        key: uploadSession.key,
        uploadId: uploadSession.uploadId,
      }).catch(() => {});
    }

    console.error("Loi khi upload file len Long Van S3:", error);
    throw new Error(
      `Upload file that bai, vui long thu lai: ${error.message}`,
    );
  }
};

export const uploadVideoToS3 = async (file, onProgress) =>
  uploadObjectToS3(file, onProgress, {
    folder: "videos",
    fallbackContentType: "video/mp4",
  });

export const uploadFileToS3 = async (file, onProgress) =>
  uploadObjectToS3(file, onProgress, {
    folder: "files",
    fallbackContentType: "application/octet-stream",
  });
