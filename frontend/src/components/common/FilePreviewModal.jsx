// components/shared/FilePreviewModal.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, X, FileText, Image, File, Play } from "lucide-react";
import { usePreviewSubmissionFileMutation, useDownloadSubmissionFileMutation } from "@/features/apis/assignmentsApi";

const FilePreviewModal = ({ 
  file, 
  submissionId, 
  open, 
  onOpenChange,
  onDownload 
})=> {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 🆕 Use RTK Query mutation for preview
  const [previewFile] = usePreviewSubmissionFileMutation();
  // const [previewFile] = useDownloadSubmissionFileMutation();


  useEffect(() => {
    if (open && file && submissionId) {
      loadPreview();
    } else {
      // Cleanup URL when modal closes
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [open, file, submissionId]);

  const loadPreview = async () => {
    if (!file || !submissionId) return;

    setLoading(true);
    setError(null);

    try {
      // 🆕 Use RTK Query mutation instead of direct fetch
      const result = await previewFile({
        submissionId, 
        fileId: file._id 
      }).unwrap();

      if (!result.blob) {
        throw new Error('No blob received');
      }

      const url = URL.createObjectURL(result.blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Preview error:', err);
      setError('Unable to preview this file type. Please download to view.');
    } finally {
      setLoading(false);
    }
  };

  // File type detection functions
  const isImageFile = (mimetype, filename) => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const imageExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    return imageTypes.includes(mimetype?.toLowerCase()) || 
           imageExtensions.some(ext => filename?.toLowerCase().endsWith(ext));
  };

  const isPdfFile = (mimetype, filename) => {
    return mimetype === 'application/pdf' || filename?.toLowerCase().endsWith('.pdf');
  };

  const isWordFile = (mimetype, filename) => {
    const wordTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const wordExtensions = ['.doc', '.docx'];
    return wordTypes.includes(mimetype) || 
           wordExtensions.some(ext => filename?.toLowerCase().endsWith(ext));
  };

  const isPowerPointFile = (mimetype, filename) => {
    const pptTypes = [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    const pptExtensions = ['.ppt', '.pptx'];
    return pptTypes.includes(mimetype) || 
           pptExtensions.some(ext => filename?.toLowerCase().endsWith(ext));
  };

  const getFileIcon = () => {
    if (isImageFile(file.mimetype, file.filename)) return <Image className="w-8 h-8" />;
    if (isPdfFile(file.mimetype, file.filename)) return <FileText className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  const getFileType = () => {
    if (isImageFile(file.mimetype, file.filename)) return 'Image';
    if (isPdfFile(file.mimetype, file.filename)) return 'PDF';
    if (isWordFile(file.mimetype, file.filename)) return 'Word Document';
    if (isPowerPointFile(file.mimetype, file.filename)) return 'PowerPoint';
    return 'Document';
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(file);
    }
  };

  const canPreviewInBrowser = () => {
    return isImageFile(file.mimetype, file.filename) || isPdfFile(file.mimetype, file.filename);
  };

  if (!file) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-6 text-center">
          <p>No file selected.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon()}
              <div>
                <p className="text-lg">{file.filename}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{getFileType()}</Badge>
                  <span className="text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p>Loading preview...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-600">
                <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Preview Not Available</p>
                <p className="text-sm mb-4 max-w-md">{error}</p>
                <Button onClick={handleDownload} className="mt-4">
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </div>
            </div>
          )}

          {previewUrl && !loading && !error && canPreviewInBrowser() && (
            <div className="h-full flex items-center justify-center">
              {isImageFile(file.mimetype, file.filename) && (
                <div className="flex flex-col items-center">
                  <img
                    src={previewUrl}
                    alt={file.filename}
                    className="max-w-full max-h-96 object-contain border rounded-lg"
                    onError={() => setError('Failed to load image. The file might be corrupted.')}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Use the download button to save the image
                  </p>
                </div>
              )}

              {/* {isPdfFile(file.mimetype, file.filename) && (
                <div className="w-full h-full flex flex-col">
                  <iframe
                    src={previewUrl}
                    title={file.filename}
                    className="w-full border rounded-lg flex-1"
                    onError={() => setError('Failed to load PDF. The file might be corrupted or too large.')}
                  />
                </div>
              )} */}

              {isPdfFile(file.mimetype, file.filename)&& (
                <div className="w-full h-full flex flex-col">
                  <iframe
                    src={previewUrl ? `${previewUrl}#toolbar=0&navpanes=0&view=FitH` : null}
                    title={file.filename}
                    className="w-full border rounded-lg flex-1"
                    onError={() => setError('Failed to load PDF. The file might be corrupted or too large.')}
                  />
                </div>
              )}
            </div>
          )}

          {previewUrl && !loading && !error && !canPreviewInBrowser() && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Direct Preview Not Supported</p>
                <p className="text-sm text-gray-600 mb-4 max-w-md">
                  {getFileType()} files cannot be previewed directly in the browser. 
                  Please download the file to view its contents.
                </p>
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download {getFileType()}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FilePreviewModal;



// import React, { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Download, X, FileText, Image, File, Play } from "lucide-react";
// import { getFilePreviewUrl } from "@/features/apis/assignmentsApi"; // Import the helper

// export default function FilePreviewModal({ 
//   file, 
//   submissionId, 
//   open, 
//   onOpenChange,
//   onDownload 
// }) {
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (open && file && submissionId) {
//       loadPreview();
//     } else {
//       // Cleanup URL when modal closes
//       if (previewUrl) {
//         URL.revokeObjectURL(previewUrl);
//         setPreviewUrl(null);
//       }
//     }
//   }, [open, file, submissionId]);

//   const loadPreview = async () => {
//     if (!file || !submissionId) return;

//     setLoading(true);
//     setError(null);

//     try {
//       // Use the helper function to get the preview URL
//       const previewEndpoint = getFilePreviewUrl(submissionId, file._id);
      
//       console.log("preview endpoint:", previewEndpoint)
//       const response = await fetch(previewEndpoint, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });

//       if (!response.ok) throw new Error('Failed to load file');
      
//       const blob = await response.blob();
//       const url = URL.createObjectURL(blob);
//       setPreviewUrl(url);
//     } catch (err) {
//       setError('Unable to preview this file type. Please download to view.');
//       console.error('Preview error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ... rest of the component remains the same ...
//   const isImageFile = (mimetype) => {
//     return mimetype.startsWith('image/');
//   };

//   const isPdfFile = (mimetype) => {
//     return mimetype === 'application/pdf';
//   };

//   const isVideoFile = (mimetype) => {
//     return mimetype.startsWith('video/');
//   };

//   const isAudioFile = (mimetype) => {
//     return mimetype.startsWith('audio/');
//   };

//   const getFileIcon = () => {
//     if (isImageFile(file.mimetype)) return <Image className="w-8 h-8" />;
//     if (isPdfFile(file.mimetype)) return <FileText className="w-8 h-8" />;
//     if (isVideoFile(file.mimetype)) return <Play className="w-8 h-8" />;
//     return <File className="w-8 h-8" />;
//   };

//   const getFileType = () => {
//     if (isImageFile(file.mimetype)) return 'Image';
//     if (isPdfFile(file.mimetype)) return 'PDF';
//     if (isVideoFile(file.mimetype)) return 'Video';
//     if (isAudioFile(file.mimetype)) return 'Audio';
//     if (file.mimetype.includes('word')) return 'Word Document';
//     if (file.mimetype.includes('powerpoint') || file.mimetype.includes('presentation')) return 'PowerPoint';
//     if (file.mimetype.includes('sheet')) return 'Spreadsheet';
//     return 'Document';
//   };

//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   const handleDownload = () => {
//     if (onDownload) {
//       onDownload(file);
//     }
//   };

//   if (!file) {
//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="p-6 text-center">
//         <p>No file selected.</p>
//       </DialogContent>
//     </Dialog>
//   );
// }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
//         <DialogHeader>
//           <DialogTitle className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               {getFileIcon()}
//               <div>
//                 <p className="text-lg">{file.filename}</p>
//                 <div className="flex items-center gap-2 mt-1">
//                   <Badge variant="outline">{getFileType()}</Badge>
//                   <span className="text-sm text-gray-500">
//                     {formatFileSize(file.size)}
//                   </span>
//                 </div>
//               </div>
//             </div>
//             <div className="flex items-center gap-2">
//               <Button variant="outline" size="sm" onClick={handleDownload}>
//                 <Download className="w-4 h-4 mr-2" />
//                 Download
//               </Button>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={() => onOpenChange(false)}
//               >
//                 <X className="w-4 h-4" />
//               </Button>
//             </div>
//           </DialogTitle>
//         </DialogHeader>

//         <div className="flex-1 overflow-auto p-4">
//           {loading && (
//             <div className="flex items-center justify-center h-64">
//               <div className="text-center">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
//                 <p>Loading preview...</p>
//               </div>
//             </div>
//           )}

//           {error && (
//             <div className="flex items-center justify-center h-64">
//               <div className="text-center text-red-600">
//                 <File className="w-12 h-12 mx-auto mb-2" />
//                 <p>{error}</p>
//                 <Button onClick={handleDownload} className="mt-3">
//                   <Download className="w-4 h-4 mr-2" />
//                   Download File
//                 </Button>
//               </div>
//             </div>
//           )}

//           {previewUrl && !loading && !error && (
//             <div className="h-full flex items-center justify-center">
//               {isImageFile(file.mimetype) && (
//                 <img
//                   src={previewUrl}
//                   alt={file.filename}
//                   className="max-w-full max-h-full object-contain"
//                   onError={() => setError('Failed to load image')}
//                 />
//               )}

//               {isPdfFile(file.mimetype) && (
//                 <iframe
//                   src={previewUrl}
//                   title={file.filename}
//                   className="w-full h-96 border rounded-lg"
//                   onError={() => setError('Failed to load PDF')}
//                 />
//               )}

//               {(isVideoFile(file.mimetype) || isAudioFile(file.mimetype)) && (
//                 <div className="text-center">
//                   <p className="mb-4">Preview not available for {getFileType()} files</p>
//                   <Button onClick={handleDownload}>
//                     <Download className="w-4 h-4 mr-2" />
//                     Download to View
//                   </Button>
//                 </div>
//               )}

//               {!isImageFile(file.mimetype) && !isPdfFile(file.mimetype) && 
//                !isVideoFile(file.mimetype) && !isAudioFile(file.mimetype) && (
//                 <div className="text-center">
//                   <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//                   <p className="mb-2">Preview not available for {getFileType()} files</p>
//                   <p className="text-sm text-gray-500 mb-4">
//                     Please download the file to view its contents
//                   </p>
//                   <Button onClick={handleDownload}>
//                     <Download className="w-4 h-4 mr-2" />
//                     Download File
//                   </Button>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }