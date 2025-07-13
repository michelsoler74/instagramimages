"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Download,
  Upload,
  ImageIcon,
  Instagram,
  Square,
  Smartphone,
  Monitor,
} from "lucide-react";

const InstagramImageOptimizer = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<Blob | null>(null);
  const [format, setFormat] = useState("square");
  const [fitMode, setFitMode] = useState("cover");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const formats = {
    square: { width: 1080, height: 1080, name: "Post Cuadrado", icon: Square },
    vertical: {
      width: 1080,
      height: 1350,
      name: "Post Vertical",
      icon: Smartphone,
    },
    story: { width: 1080, height: 1920, name: "Story", icon: Monitor },
  };

  const processImage = useCallback(
    (
      file: File,
      targetFormat: string,
      mode: string,
      bgColor: string
    ): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        let objectUrl: string | null = null;

        img.onload = () => {
          try {
            if (objectUrl) {
              URL.revokeObjectURL(objectUrl);
            }

            const canvas = canvasRef.current;
            if (!canvas) {
              throw new Error("Canvas no disponible");
            }

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              throw new Error("Contexto 2D no disponible");
            }

            const { width: targetWidth, height: targetHeight } =
              formats[targetFormat as keyof typeof formats];

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Limpiar canvas
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, targetWidth, targetHeight);

            const imgAspectRatio = img.width / img.height;
            const targetAspectRatio = targetWidth / targetHeight;

            let drawWidth: number;
            let drawHeight: number;
            let drawX: number;
            let drawY: number;

            if (mode === "contain") {
              if (imgAspectRatio > targetAspectRatio) {
                drawWidth = targetWidth;
                drawHeight = drawWidth / imgAspectRatio;
                drawX = 0;
                drawY = (targetHeight - drawHeight) / 2;
              } else {
                drawHeight = targetHeight;
                drawWidth = drawHeight * imgAspectRatio;
                drawX = (targetWidth - drawWidth) / 2;
                drawY = 0;
              }
            } else {
              if (imgAspectRatio > targetAspectRatio) {
                drawHeight = targetHeight;
                drawWidth = drawHeight * imgAspectRatio;
                drawX = (targetWidth - drawWidth) / 2;
                drawY = 0;
              } else {
                drawWidth = targetWidth;
                drawHeight = drawWidth / imgAspectRatio;
                drawX = 0;
                drawY = (targetHeight - drawHeight) / 2;
              }
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error("Error al crear el blob"));
                }
              },
              "image/jpeg",
              0.95
            );
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          reject(new Error("Error al cargar la imagen"));
        };

        objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
      });
    },
    [formats]
  );

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Por favor selecciona un archivo de imagen válido");
        return;
      }

      // Validar tamaño máximo (10MB)
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_SIZE) {
        setError("La imagen es demasiado grande. El tamaño máximo es 10MB");
        return;
      }

      setError(null);
      setIsProcessing(true);
      setSelectedImage(file);

      try {
        const processed = await processImage(
          file,
          format,
          fitMode,
          backgroundColor
        );
        setProcessedImage(processed);
      } catch (error) {
        console.error("Error al procesar la imagen:", error);
        setError("Error al procesar la imagen: " + (error as Error).message);
      } finally {
        setIsProcessing(false);
      }
    },
    [format, fitMode, backgroundColor, processImage]
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const reprocessImage = useCallback(async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      const processed = await processImage(
        selectedImage,
        format,
        fitMode,
        backgroundColor
      );
      setProcessedImage(processed);
    } catch (error) {
      console.error("Error al reprocesar la imagen:", error);
      setError("Error al reprocesar la imagen: " + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedImage, format, fitMode, backgroundColor, processImage]);

  useEffect(() => {
    if (selectedImage) {
      reprocessImage();
    }
  }, [format, fitMode, backgroundColor, reprocessImage]);

  const downloadImage = () => {
    if (!processedImage) return;

    try {
      const url = URL.createObjectURL(processedImage);
      const a = document.createElement("a");
      a.href = url;
      a.download = `instagram-${format}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar la imagen:", error);
      setError("Error al descargar la imagen");
    }
  };

  const resetApp = () => {
    setSelectedImage(null);
    setProcessedImage(null);
    setError(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Instagram className="w-12 h-12 text-pink-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">
              Instagram Image Optimizer
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            Optimiza cualquier imagen para Instagram sin perder calidad ni
            deformar
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
            <button
              onClick={resetApp}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Subir Imagen
              </h2>

              <div
                className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center cursor-pointer hover:border-white/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <ImageIcon className="w-16 h-16 text-white/60 mx-auto mb-4" />
                <p className="text-white/80 text-lg mb-2">
                  Arrastra una imagen aquí o haz clic para seleccionar
                </p>
                <p className="text-white/60 text-sm">
                  Acepta JPG, PNG, WEBP y más formatos
                </p>
                {selectedImage && (
                  <p className="text-green-400 text-sm mt-2">
                    ✓ Imagen cargada: {selectedImage.name}
                  </p>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedImage && (
                <button
                  onClick={resetApp}
                  className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Seleccionar otra imagen
                </button>
              )}
            </div>

            {/* Format Selection */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">
                Formato de Instagram
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(formats).map(
                  ([key, { name, icon: Icon, width, height }]) => (
                    <button
                      key={key}
                      onClick={() => setFormat(key)}
                      className={`flex items-center p-3 rounded-lg transition-all ${
                        format === key
                          ? "bg-pink-500 text-white shadow-lg"
                          : "bg-white/10 text-white/80 hover:bg-white/20"
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{name}</span>
                      <span className="ml-auto text-sm opacity-80">
                        {width}x{height}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Fit Mode */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">
                Modo de Ajuste
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setFitMode("cover")}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    fitMode === "cover"
                      ? "bg-pink-500 text-white"
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                  }`}
                >
                  <div className="font-medium">Recortar (Cover)</div>
                  <div className="text-sm opacity-80">
                    Llena completamente, puede recortar
                  </div>
                </button>
                <button
                  onClick={() => setFitMode("contain")}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    fitMode === "contain"
                      ? "bg-pink-500 text-white"
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                  }`}
                >
                  <div className="font-medium">Ajustar (Contain)</div>
                  <div className="text-sm opacity-80">
                    Muestra imagen completa con padding
                  </div>
                </button>
              </div>

              {fitMode === "contain" && (
                <div className="mt-4">
                  <label className="block text-white/80 text-sm mb-2">
                    Color de fondo:
                  </label>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-full h-10 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Vista Previa
              </h2>

              <div className="aspect-square bg-white/5 rounded-xl flex items-center justify-center mb-4 overflow-hidden">
                {isProcessing ? (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-white/60">Procesando...</p>
                  </div>
                ) : processedImage ? (
                  <img
                    src={URL.createObjectURL(processedImage)}
                    alt="Imagen procesada"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 text-white/30 mx-auto mb-2" />
                    <p className="text-white/60">
                      Sube una imagen para ver la vista previa
                    </p>
                  </div>
                )}
              </div>

              {processedImage && (
                <div className="space-y-3">
                  <div className="text-center text-white/80 text-sm">
                    Formato: {formats[format as keyof typeof formats].name} (
                    {formats[format as keyof typeof formats].width}x
                    {formats[format as keyof typeof formats].height}px)
                  </div>

                  <button
                    onClick={downloadImage}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Descargar Imagen Optimizada
                  </button>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-3">
                ✨ Características
              </h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• Mantiene la máxima calidad de imagen</li>
                <li>• No deforma las proporciones originales</li>
                <li>• Procesamiento completamente local</li>
                <li>• Formatos optimizados para Instagram</li>
                <li>• Descarga instantánea</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas oculto para procesamiento */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default InstagramImageOptimizer;
