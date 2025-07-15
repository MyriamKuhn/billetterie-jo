import { useDropzone } from 'react-dropzone'
import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface Props {
  previewUrl?: string
  onFileSelected: (file: File | null) => void
  label: string
}

/**
 * A dropzone component for uploading images with preview support and drag‐and‐drop styling.
 * It allows users to select an image file, displays a preview if available,
 * and provides visual feedback during drag‐and‐drop interactions.
 */
export function ImageDropzone({ previewUrl, onFileSelected, label }: Props) {
  const { t } = useTranslation('adminProducts')

  // Configure dropzone: accept a single image file, invoke onFileSelected on drop
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: ([file]) => onFileSelected(file ?? null),
    accept: { 'image/*': [] },
    multiple: false,
  })

  return (
    <Box sx={{ textAlign: 'center', mb: 2 }}>
      {/* Show existing preview or a placeholder message */}
      {previewUrl
        ? <Box component="img" src={previewUrl} sx={{ maxWidth:'100%', maxHeight:200, objectFit:'cover', mb:1 }} />
        : <Typography color="text.secondary" sx={{ mb:1 }}>{t('products.no_image')}</Typography>
      }

      {/* Dropzone area */}
      <Box
        {...getRootProps()}
        sx={{
          p:2,
          border:'2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.500',
          borderRadius:1,
          cursor:'pointer',
          bgcolor: isDragActive ? 'grey.100' : 'transparent',
        }}
      >
        {/* Hidden file input */}
        <input {...getInputProps()} />
        <Typography>
          {isDragActive ? t('products.image_here') : label}
        </Typography>
      </Box>
    </Box>
  )
}

