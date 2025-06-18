import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SatelliteRoutePage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ x: number; y: number } | null>(null);
  const [originalImageSize, setOriginalImageSize] = useState<{ width: number; height: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError('No file selected');
      return;
    }

    // Dosya boyutu kontrolü (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TIFF dosyası kontrolü
      const isTiff = file.type.toLowerCase() === 'image/tiff' || 
                    file.name.toLowerCase().endsWith('.tif') || 
                    file.name.toLowerCase().endsWith('.tiff');

      if (isTiff) {
        // TIFF dosyasını backend'e gönder
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('http://localhost:5000/api/convert-tiff', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to convert TIFF image');
        }

        const data = await response.json();
        if (!data.convertedImage) {
          throw new Error('No converted image received from server');
        }

        setSelectedImage(data.convertedImage);
        setStartPoint(null);
        setEndPoint(null);
      } else {
        // Normal resim dosyaları için mevcut işlem
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          const img = new Image();
          img.onload = () => {
            setSelectedImage(imageUrl);
            setStartPoint(null);
            setEndPoint(null);

            // Canvas boyutunu ayarla
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
              }
            }
          };
          img.onerror = () => {
            setError('Failed to load image');
          };
          img.src = imageUrl;
        };
        reader.onerror = () => {
          setError('Failed to read file');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !originalImageSize) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get click coordinates relative to canvas
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    // Convert to original image coordinates
    const x = (canvasX / canvas.width) * originalImageSize.width;
    const y = (canvasY / canvas.height) * originalImageSize.height;

    if (!startPoint) {
      setStartPoint({ x, y });
    } else if (!endPoint) {
      setEndPoint({ x, y });
    }
  };

  useEffect(() => {
    if (!selectedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = new Image();
    image.onload = () => {
      // Store original image dimensions
      setOriginalImageSize({ width: image.width, height: image.height });
      
      // Set canvas size to match image size while maintaining aspect ratio
      const maxWidth = window.innerWidth * 0.9;
      const maxHeight = window.innerHeight * 0.7;
      
      let width = image.width;
      let height = image.height;
      
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }
      
      if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width = width * ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Clear canvas and draw image
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      // Draw points if they exist
      if (startPoint) {
        const scaledStartX = (startPoint.x / image.width) * width;
        const scaledStartY = (startPoint.y / image.height) * height;
        ctx.beginPath();
        ctx.arc(scaledStartX, scaledStartY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      }

      if (endPoint) {
        const scaledEndX = (endPoint.x / image.width) * width;
        const scaledEndY = (endPoint.y / image.height) * height;
        ctx.beginPath();
        ctx.arc(scaledEndX, scaledEndY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'yellow';
        ctx.fill();
      }
    };

    image.src = selectedImage;

    return () => {
      image.onload = null;
    };
  }, [selectedImage, startPoint, endPoint]);

  const handleReset = () => {
    setStartPoint(null);
    setEndPoint(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage || !startPoint || !endPoint || !originalImageSize) {
      setError('Please select both start and end points');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/calculate-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: selectedImage,
          start: startPoint,
          end: endPoint,
          imageSize: originalImageSize
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate route');
      }

      const canvas = canvasRef.current;
      if (canvas && data.path) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const image = new Image();
          image.src = data.displayImage || selectedImage;
          image.onload = () => {
            // Clear and draw the image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

            // Draw the path
            ctx.beginPath();
            ctx.strokeStyle = 'lime';
            ctx.lineWidth = 3;
            
            if (data.path.length > 0) {
              const scaleX = canvas.width / originalImageSize.width;
              const scaleY = canvas.height / originalImageSize.height;

              ctx.moveTo(data.path[0].x * scaleX, data.path[0].y * scaleY);
              for (let i = 1; i < data.path.length; i++) {
                ctx.lineTo(data.path[i].x * scaleX, data.path[i].y * scaleY);
              }
              ctx.stroke();
            }

            // Draw start point
            const scaledStartX = (startPoint.x / originalImageSize.width) * canvas.width;
            const scaledStartY = (startPoint.y / originalImageSize.height) * canvas.height;
            ctx.beginPath();
            ctx.arc(scaledStartX, scaledStartY, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();

            // Draw end point
            const scaledEndX = (endPoint.x / originalImageSize.width) * canvas.width;
            const scaledEndY = (endPoint.y / originalImageSize.height) * canvas.height;
            ctx.beginPath();
            ctx.arc(scaledEndX, scaledEndY, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'yellow';
            ctx.fill();
          };
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Eco Pathfinder</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user?.name}</span>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with green gradient background */}
      <section className="w-full bg-gradient-to-b from-green-100 to-white text-center py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Eco Pathfinder - <span className="text-green-600">Real-time Navigation</span>
        </h1>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instructions Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">How It Works</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Upload a satellite image of your area</li>
                <li>Click to set start point (red) and destination (yellow)</li>
                <li>Use arrow keys to navigate the route</li>
                <li>System will calculate the optimal path based on terrain analysis</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Upload Image</h2>
              <input
                type="file"
                accept="image/jpeg,image/png,image/tiff,.tif,.tiff"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                disabled={loading}
              />
              {loading && <p className="text-gray-600 mt-2">Loading image...</p>}
              {error && <p className="text-red-600 mt-2">{error}</p>}
            </div>
          </div>

          {/* Navigation Area Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Navigation Area</h2>
              {selectedImage ? (
                <>
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    style={{ maxWidth: '100%', height: 'auto' }}
                    className="border border-gray-200 rounded"
                  />
                  <div className="mt-4 text-center">
                    {!startPoint && <p className="text-gray-500">Click to set start point</p>}
                    {startPoint && !endPoint && <p className="text-gray-500">Click to set destination point</p>}
                    <button
                      onClick={handleReset}
                      className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors mr-2"
                    >
                      Reset Navigation
                    </button>
                    {startPoint && endPoint && (
                      <button
                        onClick={handleSubmit}
                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        disabled={loading}
                      >
                        {loading ? 'Calculating...' : 'Calculate Route'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  Please upload an image to start navigation
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatelliteRoutePage; 