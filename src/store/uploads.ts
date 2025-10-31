import { create } from "zustand";
import { enableMapSet } from "immer";
import { immer } from "zustand/middleware/immer";
import { uploadFileToStorage } from "../http/upload-file-to-storage";

// Permite que o Immer trabalhe com Map/Set corretamente
enableMapSet();

export type Upload = {
  name: string;
  file: File;
  abortController: AbortController;
  status: "progress" | "success" | "error" | "canceled";
};

type UploadState = {
  uploads: Map<string, Upload>;
  addUploads: (files: File[]) => void;
  cancelUpload: (uploadId: string) => void;
};

// ✅ Novo padrão Zustand 5 + Immer

export const useUploads = create<UploadState>()(
  immer((set, get) => {
    async function processUpload(uploadId: string) {
      const upload = get().uploads.get(uploadId);

      if (!upload) {
        return;
      }

      try {
        await uploadFileToStorage(
          { file: upload.file },
          { signal: upload.abortController.signal }
        );

        set((state) => {
          state.uploads.set(uploadId, {
            ...upload,
            status: "success",
          });
        });
      } catch (error) {
        set((state) => {
          state.uploads.set(uploadId, {
            ...upload,
            status: "error",
          });
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

// export const useUploads = create<UploadState>()(
//     immer((set, get) => ({
//       uploads: new Map(),
//       addUploads(files) {
//         for (const file of files) {
//           const uploadId = crypto.randomUUID();
//           const upload: Upload = { name: file.name, file };

//           // Immer habilita mutação direta
//           set((state) => {
//             state.uploads.set(uploadId, upload);
//           });
//         }
//       },
//       async processUpload(){
//           const upload = get().uploads.get(uploadId);

//           if (!upload) {
//               return;
//             }

//             await uploadFileToStorage({ file: upload.file });

//       }
//     }))
//   );
