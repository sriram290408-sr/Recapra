import React, { useRef, useState } from "react";
import { Upload, FileText, Check, AlertCircle, X, Download } from "lucide-react";

const FileUploadDropzone = ({
  label,
  id,
  accept,
  onChange,
  onRemove,
  error,
  required = false,
  helperText = "Max file size: 5 MB (PDF, DOC, DOCX)",
  existingFileUrl = null,
  existingFileName = null,
  disabled = false
}) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleContainerClick = () => {
    if (!disabled) {
      fileInputRef.current.click();
    }
  };

  const handleFile = (file) => {
    if (file) {
      setSelectedFile(file);
      if (onChange) {
        onChange(file);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onRemove) {
      onRemove();
    } else if (onChange) {
      onChange(null);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Check if we have some file display (either newly selected or pre-existing)
  const hasFile = selectedFile || existingFileUrl || existingFileName;
  const fileName = selectedFile ? selectedFile.name : (existingFileName || "Uploaded Document");
  const fileSize = selectedFile ? formatSize(selectedFile.size) : "";

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        onClick={handleContainerClick} 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`w-full rounded-2xl border-2 border-dashed p-6 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center ${
          isDragActive 
            ? "border-indigo-500 bg-indigo-50/50" 
            : error 
              ? "border-red-300 bg-red-50/20 hover:bg-red-50/40" 
              : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input
          id={id}
          type="file"
          ref={fileInputRef}
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {hasFile ? (
          <div className="w-full flex items-center justify-between bg-white border border-slate-100 shadow-sm rounded-xl p-4 animate-fade-in text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <FileText size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{fileName}</p>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedFile ? fileSize : "Pre-uploaded Document"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {existingFileUrl && !selectedFile && (
                <a 
                  href={existingFileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition-colors duration-200"
                  title="Download File"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={18} />
                </a>
              )}
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors duration-200"
                title="Remove File"
                disabled={disabled}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="p-3 bg-white border border-slate-150 shadow-xs rounded-2xl text-slate-400 mb-3">
              <Upload size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800">
              Click to select or drag your file here
            </p>
            <span className="text-xs text-slate-400 font-medium mt-1">
              {helperText}
            </span>
          </div>
        )}
      </div>

      {error && (
        <span className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </span>
      )}
    </div>
  );
};

export default FileUploadDropzone;
