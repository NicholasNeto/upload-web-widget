import { create } from "zustand";
import { CanceledError } from "axios";
import { enableMapSet } from "immer";
import { immer } from "zustand/middleware/immer";
import { uploadFileToStorage } from "../http/upload-file-to-storage";
import { useShallow } from "zustand/shallow";
import { compressImage } from "../utils/compress-image";

// Permite que o Immer trabalhe com Map/Set corretamente
enableMapSet();

export type Upload = {
  name: string;
  file: File;
  abortController: AbortController;
  status: "progress" | "success" | "error" | "canceled";
  originalSizeInBytes: number;
  compressedSizeInBytes?: number;
  uploadSizeInBytes: number;
  remoteUrl?: string;
};

type UploadState = {
  uploads: Map<string, Upload>;
  addUploads: (files: File[]) => void;
  cancelUpload: (uploadId: string) => void;
};

// ✅ Novo padrão Zustand 5 + Immer

export const useUploads = create<UploadState>()(
  immer((set, get) => {

    function updateUpload(uploadId: string, data: Partial<Upload>) {
        const upload = get().uploads.get(uploadId);
  
        if (!upload) {
          return;
        }
  
        set((state) => {
          state.uploads.set(uploadId, {
            ...upload,
            ...data,
          });
        });
      }

    async function processUpload(uploadId: string) {
      const upload = get().uploads.get(uploadId);

      if (!upload) {
        return;
      }

      try {

        const compressedFile = await compressImage({
            file: upload.file,
            maxWidth: 1000,
            maxHeight: 1000,
            quality: 0.8,
          });

          updateUpload(uploadId, { compressedSizeInBytes: compressedFile.size });

          const { url } = await uploadFileToStorage(
            {
                file: compressedFile,
                onProgress(sizeInBytes) {
                updateUpload(uploadId, {
                    uploadSizeInBytes: sizeInBytes,
                    }); 
                },
              },
          { signal: upload.abortController.signal }
        );

        updateUpload(uploadId, {
            status: "success",
            remoteUrl: url,
          });
      } catch (error) {

        if (error instanceof CanceledError) {
            updateUpload(uploadId, {
                status: "canceled",
              });
  
            return;
          }

          updateUpload(uploadId, {
            status: "error",
          });

      }
    }

    function addUploads(files: File[]) {
      for (const file of files) {
        const uploadId = crypto.randomUUID();
        const abortController = new AbortController();

        const upload: Upload = {
          name: file.name,
          file,
          status: "progress",
          abortController,
          originalSizeInBytes: file.size,
          uploadSizeInBytes: 0,
        };

        set((state) => {
          state.uploads.set(uploadId, {
            ...upload,
            status: "canceled",
          });
        });

        processUpload(uploadId);
      }
    }

    function cancelUpload(uploadId: string) {
      const upload = get().uploads.get(uploadId);

      if (!upload) {
        return;
      }

      upload.abortController.abort();

      set((state) => {
        state.uploads.set(uploadId, upload);
      });
    }

    return {
      uploads: new Map(),
      addUploads,
      cancelUpload,
    };
  })
);


export const usePendingUploads = () => {
    return useUploads(
      useShallow((store) => {
        const isThereAnyPendingUploads = Array.from(store.uploads.values()).some(
          (upload) => upload.status === "progress"
        );
  
        if (!isThereAnyPendingUploads) {
          return { isThereAnyPendingUploads, globalPercentage: 100 };
        }
  
        const { total, uploaded } = Array.from(store.uploads.values()).reduce(
          (acc, upload) => {
            if (upload.compressedSizeInBytes) {
                acc.uploaded += upload.uploadSizeInBytes;
                }
      
                acc.total +=
                  upload.compressedSizeInBytes || upload.originalSizeInBytes;
  
            return acc;
          },
          { total: 0, uploaded: 0 }
        );
  
        const globalPercentage = Math.min(
          Math.round((uploaded * 100) / total),
          100
        );
  
        return { isThereAnyPendingUploads, globalPercentage };
      })
    );
  };