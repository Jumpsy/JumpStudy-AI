'use client';

import { useState } from 'react';
import { Sparkles, Download, Wand2, Image as ImageIcon, Zap } from 'lucide-react';

interface ImageGeneratorProps {
  userId: string;
  subscriptionTier: string;
  imagesRemaining: number;
  totalImages: number;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: Date;
}

export default function ImageGenerator({
  userId,
  subscriptionTier,
  imagesRemaining,
  totalImages,
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState('');

  const canGenerate = imagesRemaining > 0 || totalImages === Infinity;

  async function generateImage() {
    if (!prompt.trim() || !canGenerate) return;

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (response.ok && data.imageUrl) {
        setGeneratedImages([
          {
            url: data.imageUrl,
            prompt,
            timestamp: new Date(),
          },
          ...generatedImages,
        ]);
        setPrompt('');

        // Update remaining count
        window.location.reload();
      } else {
        setError(data.error || 'Failed to generate image');
      }
    } catch (err) {
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  function downloadImage(url: string, prompt: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${prompt.slice(0, 30)}.png`;
    link.click();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Image Generator</h1>
                <p className="text-gray-600">Create stunning images with DALL-E 3</p>
              </div>
            </div>

            {/* Usage Display */}
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl px-6 py-4 border border-purple-200">
              <div className="text-sm font-semibold text-purple-900 mb-1">Images Remaining</div>
              <div className="text-3xl font-bold text-purple-600">
                {totalImages === Infinity ? '∞' : `${imagesRemaining}/${totalImages}`}
              </div>
              {imagesRemaining === 0 && totalImages !== Infinity && (
                <a
                  href="/pricing"
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium mt-2 inline-block"
                >
                  Upgrade Plan →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Generator Input */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-12 border border-gray-200">
          <div className="max-w-3xl mx-auto">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Describe your image
            </label>
            <div className="flex gap-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A serene mountain landscape at sunset, digital art style..."
                className="flex-1 rounded-2xl border-2 border-gray-200 px-6 py-4 focus:border-purple-600 focus:outline-none resize-none h-32 text-lg"
                disabled={!canGenerate}
              />
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <Zap className="w-4 h-4 inline mr-1 text-yellow-500" />
                Powered by DALL-E 3 - High quality, commercial use allowed
              </div>

              <button
                onClick={generateImage}
                disabled={!canGenerate || !prompt.trim() || isGenerating}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-all shadow-lg hover:shadow-xl"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Image
                  </>
                )}
              </button>
            </div>

            {!canGenerate && (
              <div className="mt-4 p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-900 text-lg mb-2">
                      You've reached your image limit
                    </h3>
                    <p className="text-purple-700 mb-4">
                      Upgrade to a higher plan to generate more amazing images with AI
                    </p>
                    <a
                      href="/pricing"
                      className="inline-block bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                    >
                      View Plans
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generated Images Gallery */}
        {generatedImages.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Generated Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedImages.map((image, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow"
                >
                  <div className="aspect-square relative bg-gray-100">
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{image.prompt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {image.timestamp.toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => downloadImage(image.url, image.prompt)}
                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {generatedImages.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No images yet</h3>
            <p className="text-gray-500">
              Enter a prompt above to create your first AI-generated image
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
