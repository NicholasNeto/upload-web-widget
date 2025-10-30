import { create } from "zustand";
import { enableMapSet } from "immer";
import { immer } from "zustand/middleware/immer";
import { uploadFileToStorage } from "../http/upload-file-to-storage";

// Permite que o Immer trabalhe com Map/Set corretamente
enableMapSet();

export type Upload = {
  name: string;
  file: File;
};

type UploadState = {
  uploads: Map<string, Upload>;
  addUploads: (files: File[]) => void;
};

// ✅ Novo padrão Zustand 5 + Immer

export const useUploads = create<UploadState>()(
    immer((set, get) => {


        async function processUpload(uploadId: string) {
            const upload = get().uploads.get(uploadId);  

            if (!upload) {
                return;
              }
        
              await uploadFileToStorage({ file: upload.file });
        }

        function addUploads(files: File[]) {
            for (const file of files) {
              const uploadId = crypto.randomUUID();
      
              const upload: Upload = {
                name: file.name,
                file,
              };
      
              set((state) => {
                state.uploads.set(uploadId, upload);
              });
      
              processUpload(uploadId);
            }
          }

        return {
            uploads: new Map(),
            addUploads 
        }

    })
)
 

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