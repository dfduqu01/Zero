# Supabase Storage Strategy

## Overview

This document outlines the image and file storage strategy for the ZERO optical e-commerce platform using Supabase Storage. Supabase Storage provides S3-compatible object storage with built-in CDN, authentication, and fine-grained access control.

## Bucket Structure

### 1. Product Images (`product-images`)
- **Purpose**: Store product photos, thumbnails, and promotional images
- **Access**: Public
- **Use Cases**:
  - Main product images
  - Product galleries
  - Thumbnail images
  - Category images

### 2. Prescription Images (`prescription-images`)
- **Purpose**: Store uploaded prescription documents
- **Access**: Private (user-specific access only)
- **Use Cases**:
  - Customer prescription uploads
  - Verification documents
  - Medical records

### 3. Brand Logos (`brand-logos`)
- **Purpose**: Store pharmaceutical brand and manufacturer logos
- **Access**: Public
- **Use Cases**:
  - Brand identification
  - Manufacturer attribution
  - Marketing materials

### 4. User Avatars (`user-avatars`)
- **Purpose**: Store user profile pictures
- **Access**: Public (but user-controlled)
- **Use Cases**:
  - Customer profile photos
  - Staff/admin avatars

### 5. Documents (`documents`)
- **Purpose**: Store general documents (invoices, reports, etc.)
- **Access**: Private (role-based access)
- **Use Cases**:
  - Order invoices
  - Purchase orders
  - Reports and analytics exports

## Access Policies

### Public Buckets
**Buckets**: `product-images`, `brand-logos`, `user-avatars`

```sql
-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploads
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (auth.uid() = owner);

-- Allow admins to delete
CREATE POLICY "Admins can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.jwt() ->> 'role' = 'admin'
);
```

### Private Buckets
**Buckets**: `prescription-images`, `documents`

**Note**: All prescription uploads require authentication. Users must be logged in to upload prescriptions.

```sql
-- Users can only access their own prescriptions (authentication required)
CREATE POLICY "Users access own prescriptions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescription-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can upload their own prescriptions (authentication required)
CREATE POLICY "Users upload own prescriptions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prescription-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Staff/Pharmacists can view all prescriptions
CREATE POLICY "Staff view all prescriptions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescription-images'
  AND auth.jwt() ->> 'role' IN ('staff', 'pharmacist', 'admin')
);
```

## File Size Limits

### Size Restrictions by Bucket

| Bucket | Max File Size | Rationale |
|--------|---------------|-----------|
| `product-images` | 2 MB | Balance between quality and performance |
| `prescription-images` | 5 MB | Higher quality needed for medical verification |
| `brand-logos` | 500 KB | Logos are typically small vector or raster images |
| `user-avatars` | 1 MB | Sufficient for profile pictures |
| `documents` | 10 MB | Accommodate multi-page PDFs and reports |

### Implementation

Size limits are enforced both client-side and server-side:

```typescript
// Client-side validation
const FILE_SIZE_LIMITS = {
  'product-images': 2 * 1024 * 1024, // 2MB
  'prescription-images': 5 * 1024 * 1024, // 5MB
  'brand-logos': 500 * 1024, // 500KB
  'user-avatars': 1 * 1024 * 1024, // 1MB
  'documents': 10 * 1024 * 1024, // 10MB
};

function validateFileSize(file: File, bucket: string): boolean {
  const maxSize = FILE_SIZE_LIMITS[bucket];
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
  }
  return true;
}
```

## Allowed File Formats

### By Bucket Type

| Bucket | Allowed Formats | MIME Types |
|--------|-----------------|------------|
| `product-images` | JPG, PNG, WEBP | `image/jpeg`, `image/png`, `image/webp` |
| `prescription-images` | JPG, PNG, PDF | `image/jpeg`, `image/png`, `application/pdf` |
| `brand-logos` | JPG, PNG, SVG, WEBP | `image/jpeg`, `image/png`, `image/svg+xml`, `image/webp` |
| `user-avatars` | JPG, PNG, WEBP | `image/jpeg`, `image/png`, `image/webp` |
| `documents` | PDF | `application/pdf` |

### Format Validation

```typescript
const ALLOWED_FORMATS = {
  'product-images': ['image/jpeg', 'image/png', 'image/webp'],
  'prescription-images': ['image/jpeg', 'image/png', 'application/pdf'],
  'brand-logos': ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
  'user-avatars': ['image/jpeg', 'image/png', 'image/webp'],
  'documents': ['application/pdf'],
};

function validateFileFormat(file: File, bucket: string): boolean {
  const allowedFormats = ALLOWED_FORMATS[bucket];
  if (!allowedFormats.includes(file.type)) {
    throw new Error(
      `Invalid file format. Allowed: ${allowedFormats.join(', ')}`
    );
  }
  return true;
}
```

## Image Optimization Strategy

### Next.js Image Component Integration

Leverage Next.js Image component for automatic optimization:

```tsx
import Image from 'next/image';

// Product image example
<Image
  src={`${supabaseUrl}/storage/v1/object/public/product-images/${imagePath}`}
  alt={product.name}
  width={800}
  height={600}
  quality={85}
  placeholder="blur"
  blurDataURL={product.blurDataUrl}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### Optimization Techniques

#### 1. Client-Side Compression (Pre-Upload)

```typescript
import imageCompression from 'browser-image-compression';

async function compressImage(file: File, bucket: string): Promise<File> {
  const options = {
    maxSizeMB: bucket === 'product-images' ? 2 : 5,
    maxWidthOrHeight: bucket === 'product-images' ? 2048 : 4096,
    useWebWorker: true,
    fileType: 'image/webp', // Convert to WebP for better compression
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Return original if compression fails
  }
}
```

#### 2. Server-Side Image Transformation

Supabase supports image transformations via URL parameters:

```typescript
// Generate optimized URLs
function getOptimizedImageUrl(
  path: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  }
): string {
  const { width, height, quality = 80, format = 'webp' } = options;

  const baseUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${path}`;
  const params = new URLSearchParams();

  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  params.append('quality', quality.toString());
  params.append('format', format);

  return `${baseUrl}?${params.toString()}`;
}

// Usage
const thumbnailUrl = getOptimizedImageUrl('products/product-123.jpg', {
  width: 300,
  height: 300,
  quality: 75,
  format: 'webp'
});
```

#### 3. Responsive Images

Generate multiple sizes for responsive design:

```typescript
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 },
};

function generateResponsiveSrcSet(imagePath: string): string {
  return Object.entries(IMAGE_SIZES)
    .map(([size, dimensions]) => {
      const url = getOptimizedImageUrl(imagePath, dimensions);
      return `${url} ${dimensions.width}w`;
    })
    .join(', ');
}
```

#### 4. Lazy Loading

```tsx
// Implement lazy loading for product galleries
<Image
  src={imageUrl}
  alt={alt}
  loading="lazy"
  placeholder="blur"
  blurDataURL={blurDataUrl}
/>
```

## Naming Conventions

### File Naming Structure

Follow a consistent naming convention to ensure organization and prevent conflicts:

```
{bucket}/{category}/{identifier}-{timestamp}-{random}.{extension}
```

### Examples

#### Product Images
```
product-images/medicines/prod-550e8400-e29b-41d4-a716-446655440000-1730678400-abc123.webp
product-images/supplements/prod-123e4567-e89b-12d3-a456-426614174000-1730678401-def456.jpg
```

#### Prescription Images
```
prescription-images/{user_id}/rx-550e8400-e29b-41d4-a716-446655440000-1730678400.pdf
prescription-images/{user_id}/rx-123e4567-e89b-12d3-a456-426614174000-1730678401.jpg
```

#### Brand Logos
```
brand-logos/pfizer-logo.svg
brand-logos/johnson-johnson-logo.png
```

#### User Avatars
```
user-avatars/{user_id}/avatar-1730678400.webp
user-avatars/{user_id}/avatar-1730678401.jpg
```

### Naming Convention Helper

```typescript
import { v4 as uuidv4 } from 'uuid';

interface FileNamingOptions {
  bucket: string;
  category?: string;
  userId?: string;
  productId?: string;
  originalName?: string;
}

function generateFileName(
  file: File,
  options: FileNamingOptions
): string {
  const { bucket, category, userId, productId, originalName } = options;

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';

  // For prescriptions (user-specific)
  if (bucket === 'prescription-images' && userId) {
    return `${userId}/rx-${uuidv4()}-${timestamp}.${extension}`;
  }

  // For product images
  if (bucket === 'product-images' && category) {
    const prefix = productId || uuidv4();
    return `${category}/prod-${prefix}-${timestamp}-${random}.${extension}`;
  }

  // For brand logos (use original name with sanitization)
  if (bucket === 'brand-logos' && originalName) {
    const sanitized = originalName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');
    return `${sanitized}.${extension}`;
  }

  // For user avatars
  if (bucket === 'user-avatars' && userId) {
    return `${userId}/avatar-${timestamp}.${extension}`;
  }

  // Default naming
  return `${uuidv4()}-${timestamp}.${extension}`;
}
```

## CDN Considerations

### Supabase CDN Features

Supabase Storage includes a built-in global CDN that provides:

1. **Automatic Caching**: Static assets are cached at edge locations worldwide
2. **Fast Delivery**: Content served from the nearest edge location to the user
3. **No Additional Configuration**: CDN is enabled by default for public buckets
4. **Cache Control**: Customizable cache headers for optimal performance

### Cache Strategy

```typescript
// Set cache headers when uploading files
async function uploadWithCacheControl(
  bucket: string,
  path: string,
  file: File,
  isPublic: boolean = true
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600', // Cache for 1 hour
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;
  return data;
}
```

### Cache Control Guidelines

| Content Type | Cache Duration | Rationale |
|--------------|----------------|-----------|
| Product Images | 1 hour (3600s) | May update occasionally |
| Brand Logos | 1 week (604800s) | Rarely change |
| User Avatars | 1 hour (3600s) | Users may update |
| Prescriptions | Private (no cache) | Sensitive data |

### Cache Invalidation

When updating images, use versioned URLs or unique filenames:

```typescript
// Option 1: Versioned URLs
const imageUrl = `${baseUrl}?v=${Date.now()}`;

// Option 2: Unique filenames (recommended)
const newFileName = generateFileName(file, options);
```

### Performance Optimization

```typescript
// Preload critical images
<link
  rel="preload"
  as="image"
  href={`${supabaseUrl}/storage/v1/object/public/product-images/${heroImage}`}
/>

// Use Supabase's image transformation for optimal delivery
const optimizedUrl = getOptimizedImageUrl(imagePath, {
  width: 1200,
  quality: 85,
  format: 'webp'
});
```

## Implementation Example

### Complete Upload Flow

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

async function uploadProductImage(
  file: File,
  productId: string,
  category: string
): Promise<string> {
  const supabase = createClientComponentClient();

  // 1. Validate file
  validateFileSize(file, 'product-images');
  validateFileFormat(file, 'product-images');

  // 2. Compress image
  const compressedFile = await compressImage(file, 'product-images');

  // 3. Generate filename
  const fileName = generateFileName(compressedFile, {
    bucket: 'product-images',
    category,
    productId,
  });

  // 4. Upload to Supabase
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, compressedFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: compressedFile.type,
    });

  if (error) throw error;

  // 5. Return public URL
  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}
```

### Upload Prescription (Private)

```typescript
async function uploadPrescription(
  file: File,
  userId: string
): Promise<string> {
  const supabase = createClientComponentClient();

  // 1. Validate
  validateFileSize(file, 'prescription-images');
  validateFileFormat(file, 'prescription-images');

  // 2. Generate filename
  const fileName = generateFileName(file, {
    bucket: 'prescription-images',
    userId,
  });

  // 3. Upload
  const { data, error } = await supabase.storage
    .from('prescription-images')
    .upload(fileName, file, {
      cacheControl: '0', // No caching for private data
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  // 4. Return path (not public URL, as it's private)
  return data.path;
}

// Retrieve private prescription with signed URL
async function getPrescriptionUrl(path: string): Promise<string> {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase.storage
    .from('prescription-images')
    .createSignedUrl(path, 3600); // Valid for 1 hour

  if (error) throw error;
  return data.signedUrl;
}
```

## Security Best Practices

1. **Always validate files client-side AND server-side**
2. **Use Row Level Security (RLS) policies** for all buckets
3. **Never expose storage keys** in client-side code
4. **Implement rate limiting** on upload endpoints
5. **Scan uploaded files** for malware (consider integrating with services like VirusTotal)
6. **Use signed URLs** for private content with short expiration times
7. **Implement proper authentication checks** before allowing uploads
8. **Log all storage operations** for audit trails

## Monitoring and Maintenance

### Metrics to Track

- Total storage used per bucket
- Upload success/failure rates
- Average file sizes
- CDN hit rates
- Access patterns for private buckets

### Regular Maintenance Tasks

1. **Clean up orphaned files** (files not referenced in database)
2. **Monitor storage costs** and optimize as needed
3. **Review and update access policies** regularly
4. **Archive old prescriptions** according to retention policies
5. **Generate storage usage reports** monthly

## References

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Image Compression Best Practices](https://web.dev/fast/#optimize-your-images)
