import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye } from "lucide-react";

const FilesPopover = ({ files }) => {
  const isPreviewable = (mimetype) => {
    const previewableTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
    return previewableTypes.includes(mimetype);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          View Files ({files.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium">Submitted Files</h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm truncate">{file.filename}</span>
                </div>
                <div className="flex items-center gap-1">
                  {isPreviewable(file.mimetype) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Create a temporary link to download the file
                      const link = document.createElement('a');
                      link.href = file.url;
                      link.download = file.filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilesPopover;