import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { ImageDropzone } from './ImageDropzone'

// 1) Mock useTranslation to return the key
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

let isDragActiveFlag = false

// 2) mock react-dropzone pour propager onDrop
vi.mock('react-dropzone', () => ({
  useDropzone: (options: any) => ({
    getRootProps: () => ({}),
    getInputProps: () => ({
      type: 'file',
      'data-testid': 'file-input',
      onChange: (e: any) => {
        const file = e.target.files[0]
        options.onDrop([file])
      }
    }),
    isDragActive: isDragActiveFlag
  })
}))

describe('<ImageDropzone />', () => {
  const label = 'Click or drop'
  const file = new File(['abc'], 'test.png', { type: 'image/png' })
  let onFileSelected: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onFileSelected = vi.fn()
  })

  it('shows "no_image" text and label when no previewUrl', () => {
    render(
      <ImageDropzone
        previewUrl={undefined}
        onFileSelected={onFileSelected}
        label={label}
      />
    )

    expect(screen.getByText('products.no_image')).toBeInTheDocument()
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('shows an <img> when previewUrl is provided', () => {
    const url = 'http://example.com/img.png'
    render(
      <ImageDropzone
        previewUrl={url}
        onFileSelected={onFileSelected}
        label={label}
      />
    )

    const img = screen.getByRole('img') as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img.src).toBe(url)
    expect(screen.queryByText('products.no_image')).toBeNull()
  })

  it('renders image_here text when drag is active', () => {
    // on active le flag
    isDragActiveFlag = true

    render(
      <ImageDropzone
        previewUrl={undefined}
        onFileSelected={onFileSelected}
        label={label}
      />
    )

    expect(screen.getByText('products.image_here')).toBeInTheDocument()
  })

  it('calls onFileSelected with dropped file', () => {
    render(
      <ImageDropzone
        previewUrl={undefined}
        onFileSelected={onFileSelected}
        label={label}
      />
    )

    const input = screen.getByTestId('file-input') as HTMLInputElement

    fireEvent.change(input, {
      target: { files: [file] }
    })

    expect(onFileSelected).toHaveBeenCalledWith(file)
  })

  it('calls onFileSelected with null when no file provided', () => {
    render(
      <ImageDropzone
        previewUrl={undefined}
        onFileSelected={onFileSelected}
        label={label}
      />
    )

    const input = screen.getByTestId('file-input') as HTMLInputElement

    // Simule un change sans fichier
    fireEvent.change(input, {
      target: { files: [] }
    })

    expect(onFileSelected).toHaveBeenCalledWith(null)
  })
})
