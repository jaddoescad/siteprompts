import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Upload, Trash2, Loader, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Initialize Supabase client
const supabase = createClient();

const ImageModal = ({ isOpen, onClose, imageUrl }) => {
  const [loading, setLoading] = useState(true);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:max-h-[80vh] p-0 bg-white overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <Loader className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          )}
          <img 
            src={imageUrl} 
            alt="Uploaded file" 
            className="max-w-full max-h-full object-contain"
            onLoad={() => setLoading(false)}
            style={{ display: loading ? 'none' : 'block' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const FilesView = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (copiedUrl) {
      const timer = setTimeout(() => {
        setCopiedUrl(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedUrl]);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .storage
      .from('test')
      .list();

    if (error) {
      console.error('Error fetching images:', error);
    } else {
      const filesWithUrls = await Promise.all(data.map(async (file) => {
        const { data: urlData } = supabase
          .storage
          .from('test')
          .getPublicUrl(file.name);
        return { ...file, url: urlData.publicUrl };
      }));
      setFiles(filesWithUrls || []);
    }
  };

  const handleFileUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('test')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      await fetchImages();
    } catch (error) {
      alert('Error uploading image!');
      console.log(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageName) => {
    try {
      const { error } = await supabase.storage
        .from('test')
        .remove([imageName]);

      if (error) {
        throw error;
      }

      await fetchImages();
    } catch (error) {
      alert('Error deleting image!');
      console.log(error);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Files</h2>
      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
          ref={fileInputRef}
        />
        <Button onClick={triggerFileInput} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Image'}
          <Upload className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <ul className="space-y-4">
        {files.map((file) => (
          <li key={file.name} className="flex items-center justify-between bg-gray-100 p-2 rounded">
            <div className="flex items-center cursor-pointer" onClick={() => handleImageClick(file.url)}>
              <img 
                src={file.url} 
                alt={file.name} 
                className="w-12 h-12 object-cover rounded mr-3"
              />
              <span>{file.name}</span>
            </div>
            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(file.url);
                      }}
                    >
                      {copiedUrl === file.url ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copiedUrl === file.url ? 'Copied!' : 'Copy URL'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file.name);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <ImageModal 
        isOpen={!!selectedImage} 
        onClose={() => setSelectedImage(null)} 
        imageUrl={selectedImage} 
      />
    </div>
  );
};