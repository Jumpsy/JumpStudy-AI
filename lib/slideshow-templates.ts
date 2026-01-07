export interface SlideTemplate {
  id: string;
  name: string;
  preview: string; // Base64 or color scheme
  theme: {
    background: string;
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    accentColor: string;
    fontFamily: string;
    titleFont: string;
  };
  layout: 'centered' | 'split' | 'minimal' | 'bold' | 'classic';
}

export const SLIDESHOW_TEMPLATES: SlideTemplate[] = [
  {
    id: 'professional-blue',
    name: 'Template A',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    theme: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
      textColor: '#ffffff',
      accentColor: '#ffd89b',
      fontFamily: 'Inter, sans-serif',
      titleFont: 'Poppins, sans-serif',
    },
    layout: 'centered',
  },
  {
    id: 'minimal-clean',
    name: 'Template B',
    preview: 'linear-gradient(to right, #ffffff, #f7f7f7)',
    theme: {
      background: '#ffffff',
      primaryColor: '#1a1a1a',
      secondaryColor: '#4a4a4a',
      textColor: '#2d3748',
      accentColor: '#3b82f6',
      fontFamily: 'system-ui, sans-serif',
      titleFont: 'Helvetica Neue, sans-serif',
    },
    layout: 'minimal',
  },
  {
    id: 'creative-gradient',
    name: 'Template C',
    preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    theme: {
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      primaryColor: '#f093fb',
      secondaryColor: '#f5576c',
      textColor: '#ffffff',
      accentColor: '#ffd89b',
      fontFamily: 'Montserrat, sans-serif',
      titleFont: 'Playfair Display, serif',
    },
    layout: 'bold',
  },
  {
    id: 'dark-mode',
    name: 'Template D',
    preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    theme: {
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      primaryColor: '#0f3460',
      secondaryColor: '#16213e',
      textColor: '#e9ecef',
      accentColor: '#00d9ff',
      fontFamily: 'Inter, sans-serif',
      titleFont: 'Space Grotesk, sans-serif',
    },
    layout: 'split',
  },
  {
    id: 'educational-warm',
    name: 'Template E',
    preview: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
    theme: {
      background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
      primaryColor: '#ff6b6b',
      secondaryColor: '#feca57',
      textColor: '#ffffff',
      accentColor: '#48dbfb',
      fontFamily: 'Nunito, sans-serif',
      titleFont: 'Quicksand, sans-serif',
    },
    layout: 'centered',
  },
  {
    id: 'corporate-professional',
    name: 'Template F',
    preview: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
    theme: {
      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      primaryColor: '#2c3e50',
      secondaryColor: '#34495e',
      textColor: '#ecf0f1',
      accentColor: '#3498db',
      fontFamily: 'Roboto, sans-serif',
      titleFont: 'Lato, sans-serif',
    },
    layout: 'classic',
  },
  {
    id: 'nature-green',
    name: 'Template G',
    preview: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    theme: {
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      primaryColor: '#11998e',
      secondaryColor: '#38ef7d',
      textColor: '#ffffff',
      accentColor: '#ffd32a',
      fontFamily: 'Open Sans, sans-serif',
      titleFont: 'Merriweather, serif',
    },
    layout: 'split',
  },
  {
    id: 'sunset-orange',
    name: 'Template H',
    preview: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    theme: {
      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      primaryColor: '#fa709a',
      secondaryColor: '#fee140',
      textColor: '#ffffff',
      accentColor: '#30cfd0',
      fontFamily: 'Raleway, sans-serif',
      titleFont: 'Abril Fatface, cursive',
    },
    layout: 'bold',
  },
];

export function getTemplateById(id: string): SlideTemplate | undefined {
  return SLIDESHOW_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByTheme(theme: string): SlideTemplate[] {
  // Map AI-suggested themes to our templates
  const themeMapping: Record<string, string[]> = {
    professional: ['professional-blue', 'corporate-professional', 'minimal-clean'],
    creative: ['creative-gradient', 'sunset-orange', 'nature-green'],
    minimal: ['minimal-clean', 'dark-mode'],
    educational: ['educational-warm', 'nature-green', 'professional-blue'],
    dark: ['dark-mode', 'corporate-professional'],
    colorful: ['creative-gradient', 'educational-warm', 'sunset-orange'],
  };

  const templateIds = themeMapping[theme] || [];
  return templateIds
    .map((id) => getTemplateById(id))
    .filter((t): t is SlideTemplate => t !== undefined);
}
