import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface StoryUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId?: string;
}

export default function StoryUpload({ isOpen, onClose, onSuccess, userId }: StoryUploadProps) {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontSize, setFontSize] = useState(24);
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colorOptions = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008000'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Solo se permiten imágenes y videos');
      return;
    }

    // Validar tamaño (máximo 100MB para videos)
    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`El archivo es demasiado grande (máximo ${file.type.startsWith('video/') ? '100MB' : '50MB'})`);
      return;
    }

    // Validar duración de video (máximo 1.5 minutos)
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const duration = video.duration;
        if (duration > 90) { // 1.5 minutos = 90 segundos
          setError('El video es demasiado largo (máximo 1.5 minutos)');
          setMediaFile(null);
          setMediaPreview(null);
          return;
        }
      };
      video.src = URL.createObjectURL(file);
    }

    setMediaFile(file);
    setError(null);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const compressImage = async (file: File, maxWidth: number = 1080, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a blob con compresión
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from('stories')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('stories')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('❌ Error subiendo archivo:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mediaFile || !userId) {
      setError('Selecciona un archivo y asegúrate de estar autenticado');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      console.log('📤 Subiendo historia...');

      // Comprimir imagen si es necesario
      let fileToUpload = mediaFile;
      if (mediaFile.type.startsWith('image/')) {
        console.log('🗜️ Comprimiendo imagen...');
        fileToUpload = await compressImage(mediaFile);
      }

      // Subir a storage
      console.log('☁️ Subiendo a storage...');
      const mediaUrl = await uploadToStorage(fileToUpload);

      // Crear historia en la base de datos
      console.log('💾 Guardando historia...');
      const { data, error: dbError } = await supabase
        .from('stories')
        .insert({
          author_id: userId,
          content: content.trim() || null,
          media_url: mediaUrl,
          media_type: mediaFile.type.startsWith('image/') ? 'image' : 'video',
          background_color: backgroundColor,
          text_color: textColor,
          font_size: fontSize,
          text_position: textPosition
        });

      if (dbError) {
        throw dbError;
      }

      console.log('✅ Historia creada exitosamente');

      // Limpiar formulario
      resetForm();
      
      // Cerrar modal
      onClose();
      
      // Notificar éxito
      onSuccess?.();

    } catch (error) {
      console.error('❌ Error creando historia:', error);
      setError('Error creando historia. Intenta nuevamente.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setContent('');
    setBackgroundColor('#000000');
    setTextColor('#FFFFFF');
    setFontSize(24);
    setTextPosition('center');
    setError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Crear Historia</h2>
            <p className="text-sm text-gray-500">Comparte tu producto o servicio</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Selección de archivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona una imagen o video
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Imágenes: máximo 50MB | Videos: máximo 100MB y 1.5 minutos. Se comprimirá automáticamente.
            </p>
          </div>

          {/* Preview */}
          {mediaPreview && (
            <div className="relative">
              <div 
                className="w-full h-48 rounded-lg overflow-hidden relative"
                style={{ backgroundColor: backgroundColor }}
              >
                {mediaFile?.type.startsWith('image/') ? (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    className="w-full h-full object-cover"
                    controls
                  />
                )}

                {/* Texto superpuesto */}
                {content && (
                  <div 
                    className={`absolute left-4 right-4 ${
                      textPosition === 'top' ? 'top-4' :
                      textPosition === 'bottom' ? 'bottom-4' :
                      'top-1/2 transform -translate-y-1/2'
                    }`}
                  >
                    <p
                      className="text-center font-medium"
                      style={{
                        color: textColor,
                        fontSize: `${fontSize}px`,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                      }}
                    >
                      {content}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Texto de la historia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texto (opcional)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe tu producto o servicio..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {content.length}/500 caracteres
            </p>
          </div>

          {/* Colores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color de fondo
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300"
                />
                <div className="flex flex-wrap gap-1">
                  {colorOptions.slice(0, 8).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBackgroundColor(color)}
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color del texto
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300"
                />
                <div className="flex flex-wrap gap-1">
                  {colorOptions.slice(0, 8).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTextColor(color)}
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tamaño de fuente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tamaño del texto: {fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Posición del texto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Posición del texto
            </label>
            <div className="flex gap-2">
              {[
                { value: 'top', label: 'Arriba' },
                { value: 'center', label: 'Centro' },
                { value: 'bottom', label: 'Abajo' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTextPosition(option.value as any)}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    textPosition === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!mediaFile || uploading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              {uploading ? 'Creando...' : 'Crear Historia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
