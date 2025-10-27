import { useDropzone } from "react-dropzone";
import CircularProgressBar from "./ui/circular-progress-bar";

export function UploadWidgetDropzone() {

    const isThereAnyPendindUpload = true;
  const uploadGlobalPercentage = 66;

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    multiple: true,
    accept: {
      "image/jpeg": [],
      "image/png": [],
    },
    onDrop(acceptedFiles) {
        console.log(acceptedFiles);
      },
  });
  return (
    <div className="px-3 flex flex-col">
      <div
        data-active={isDragActive}
        className="cursor-pointer text-zinc-400 bg-black/20 p-5 rounded-lg border border-zinc-700 border-dashed h-32 flex flex-col items-center justify-center gap-1 hover:border-zinc-600 transition-colors data-[active=true]:bg-indigo-500/10 data-[active=true]:border-indigo-500"
        {...getRootProps()}
      >
        <input type="file" {...getInputProps()} />

        {isThereAnyPendindUpload ? (
            <CircularProgressBar 
            progress={uploadGlobalPercentage}
            size={56}
            strokeWidth={4}
            />
        ) : (
            <>
            <span className="text-xs">Drop your files here or</span>
            <span className="text-xs underline">click to open picker</span>
            </>
        )}
      </div>
      <span className="text-xxs text-zinc-400">
        Only PNG and JPG files are supported.
      </span>
    </div>
  );
}
