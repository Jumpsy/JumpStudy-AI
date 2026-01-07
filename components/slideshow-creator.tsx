'use client';

import { useState } from 'react';
import { Presentation, Wand2, Download, Play, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { SLIDESHOW_TEMPLATES, SlideTemplate } from '@/lib/slideshow-templates';

interface Slide {
  title: string;
  content: string[];
  images: Array<{
    url: string;
    thumb: string;
    alt: string;
  }>;
  selectedImage: {
    url: string;
    alt: string;
  } | null;
  notes?: string;
  imageQuery: string;
}

export default function SlideshowCreator() {
  const [step, setStep] = useState<'input' | 'template' | 'generating' | 'preview'>('input');
  const [topic, setTopic] = useState('');
  const [numberOfSlides, setNumberOfSlides] = useState(8);
  const [audience, setAudience] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<SlideTemplate | null>(null);
  const [slideshow, setSlideshow] = useState<any>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateSlideshow() {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setStep('generating');

    try {
      const response = await fetch('/api/slideshow/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          numberOfSlides,
          audience,
        }),
      });

      const data = await response.json();

      if (data.slideshow) {
        setSlideshow(data.slideshow);
        setStep('template');
      } else {
        alert(data.error || 'Failed to generate slideshow');
        setStep('input');
      }
    } catch (error) {
      console.error('Error generating slideshow:', error);
      alert('Failed to generate slideshow');
      setStep('input');
    } finally {
      setIsGenerating(false);
    }
  }

  function selectTemplate(template: SlideTemplate) {
    setSelectedTemplate(template);
    setStep('preview');
  }

  function changeImage(slideIndex: number, imageIndex: number) {
    if (!slideshow) return;

    const updatedSlides = [...slideshow.slides];
    updatedSlides[slideIndex].selectedImage = updatedSlides[slideIndex].images[imageIndex];
    setSlideshow({ ...slideshow, slides: updatedSlides });
  }

  async function exportSlideshow(format: 'pptx' | 'pdf') {
    // This would call an export API
    alert(`Export to ${format.toUpperCase()} coming soon!`);
  }

  function renderSlide(slide: Slide, index: number) {
    if (!selectedTemplate) return null;

    const { theme } = selectedTemplate;

    return (
      <div
        className="relative w-full h-full flex flex-col justify-center items-center p-16"
        style={{
          background: theme.background,
          color: theme.textColor,
          fontFamily: theme.fontFamily,
        }}
      >
        {/* Background Image */}
        {slide.selectedImage && (
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(${slide.selectedImage.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 max-w-4xl w-full">
          <h1
            className="text-6xl font-bold mb-8"
            style={{
              fontFamily: theme.titleFont,
              color: theme.textColor,
            }}
          >
            {slide.title}
          </h1>

          <ul className="space-y-4 text-2xl">
            {slide.content.map((point, idx) => (
              <li
                key={idx}
                className="flex items-start gap-4"
                style={{ color: theme.textColor }}
              >
                <span
                  className="flex-shrink-0 w-3 h-3 rounded-full mt-3"
                  style={{ backgroundColor: theme.accentColor }}
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Slide Number */}
        <div
          className="absolute bottom-8 right-8 text-lg opacity-60"
          style={{ color: theme.textColor }}
        >
          {index + 1} / {slideshow?.slides.length || 0}
        </div>
      </div>
    );
  }

  // Input Step
  if (step === 'input') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-12">
          <div className="text-center mb-12">
            <Presentation className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Slideshow Creator</h1>
            <p className="text-gray-600">Create beautiful presentations in seconds</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What's your presentation about?
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Climate Change, The Solar System, Marketing Strategy"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of slides
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="3"
                  max="20"
                  value={numberOfSlides}
                  onChange={(e) => setNumberOfSlides(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-2xl font-bold text-purple-600 w-12 text-center">
                  {numberOfSlides}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target audience (optional)
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g., High school students, Business executives"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
              />
            </div>

            <button
              onClick={generateSlideshow}
              disabled={!topic.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
            >
              <Wand2 className="w-5 h-5" />
              Generate Slideshow
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generating Step
  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 border-8 border-purple-200 rounded-full"></div>
            <div className="absolute inset-0 border-8 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Creating Your Slideshow</h2>
          <p className="text-gray-600">Generating slides, finding images, and making it beautiful...</p>
        </div>
      </div>
    );
  }

  // Template Selection Step
  if (step === 'template') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Choose a Design</h1>
            <p className="text-gray-600">Select a template that matches your style</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {SLIDESHOW_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => selectTemplate(template)}
                className="group relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <div
                  className="h-48 flex items-center justify-center"
                  style={{ background: template.preview }}
                >
                  <div className="text-center">
                    <div
                      className="text-4xl font-bold mb-2"
                      style={{ color: template.theme.textColor }}
                    >
                      Aa
                    </div>
                    <div
                      className="w-24 h-1 mx-auto rounded"
                      style={{ backgroundColor: template.theme.accentColor }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-white">
                  <p className="font-semibold text-gray-900 text-center">{template.name}</p>
                </div>

                <div className="absolute inset-0 bg-purple-600 bg-opacity-0 group-hover:bg-opacity-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <span className="bg-white text-purple-600 px-6 py-2 rounded-full font-semibold shadow-lg">
                    Select
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Preview Step
  if (step === 'preview' && slideshow && selectedTemplate) {
    const currentSlide = slideshow.slides[currentSlideIndex];

    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep('template')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-white">{slideshow.title}</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => exportSlideshow('pdf')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={() => exportSlideshow('pptx')}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PPTX
            </button>
          </div>
        </div>

        {/* Main Preview */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative w-full max-w-6xl aspect-[16/9] bg-white rounded-xl shadow-2xl overflow-hidden">
            {renderSlide(currentSlide, currentSlideIndex)}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
          {/* Image Options */}
          {currentSlide.images && currentSlide.images.length > 1 && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Choose a different image:</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {currentSlide.images.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => changeImage(currentSlideIndex, idx)}
                    className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      currentSlide.selectedImage?.url === img.url
                        ? 'border-purple-600 scale-105'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <img src={img.thumb} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Slide Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
              disabled={currentSlideIndex === 0}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {slideshow.slides.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentSlideIndex
                      ? 'bg-purple-600 w-8'
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() =>
                setCurrentSlideIndex(
                  Math.min(slideshow.slides.length - 1, currentSlideIndex + 1)
                )
              }
              disabled={currentSlideIndex === slideshow.slides.length - 1}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
