'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { compressImage } from '@/lib/utils/product-helpers';

export interface UploadedImage {
  file: File;
  preview: string;
}

export interface ExistingImage {
  id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  existingImages?: ExistingImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  onExistingImageDelete?: (imageId: string) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export default function ImageUploader({
  images,
  existingImages = [],
  onImagesChange,
  onExistingImageDelete,
  maxImages = 5,
  maxSizeMB = 10,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalImages = images.length + existingImages.length;
  const canAddMore = totalImages < maxImages;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);
    setIsCompressing(true);

    try {
      const newImages: UploadedImage[] = [];

      for (const file of files) {
        // Check if we've reached max images
        if (totalImages + newImages.length >= maxImages) {
          setError(`Solo puedes subir un máximo de ${maxImages} imágenes`);
          break;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError(`${file.name} no es una imagen válida`);
          continue;
        }

        // Validate file size
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(`${file.name} es demasiado grande. Máximo ${maxSizeMB}MB`);
          continue;
        }

        // Compress image
        const compressed = await compressImage(file);
        const compressedFile = new File([compressed], file.name, { type: file.type });

        // Create preview
        const preview = URL.createObjectURL(compressedFile);

        newImages.push({
          file: compressedFile,
          preview,
        });
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
      }
    } catch (err) {
      console.error('Error processing images:', err);
      setError('Error al procesar las imágenes');
    } finally {
      setIsCompressing(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveNew = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  const handleRemoveExisting = (imageId: string) => {
    if (onExistingImageDelete) {
      onExistingImageDelete(imageId);
    }
  };


  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {canAddMore && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isCompressing}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isCompressing ? 'Procesando...' : `Subir Imágenes (${totalImages}/${maxImages})`}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Máximo {maxImages} imágenes. Tamaño máximo por imagen: {maxSizeMB}MB
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Imágenes Actuales</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {existingImages.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                  <Image
                    src={image.image_url}
                    alt="Product image"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveExisting(image.id)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                {image.is_primary && (
                  <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Principal
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Images */}
      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Nuevas Imágenes ({images.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded overflow-hidden bg-gray-100 border-2 border-gray-200">
                  <Image
                    src={image.preview}
                    alt="Product image preview"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveNew(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                {index === 0 && images.length > 0 && existingImages.length === 0 && (
                  <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Principal
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalImages === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No hay imágenes</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
          >
            <Upload className="h-4 w-4 mr-2" />
            Subir Primera Imagen
          </Button>
        </div>
      )}
    </div>
  );
}
