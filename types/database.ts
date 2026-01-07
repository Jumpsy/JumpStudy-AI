export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          subscription_tier: 'credits';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          subscription_tier?: 'credits';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          subscription_tier?: 'credits';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
      };
      usage: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          messages_used: number;
          images_used: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          messages_used?: number;
          images_used?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month?: string;
          messages_used?: number;
          images_used?: number;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at?: string;
          image_url?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          created_at?: string;
          image_url?: string | null;
        };
      };
    };
  };
};

// Legacy subscription limits - DEPRECATED, now using credits system
// Kept for backwards compatibility only
export const SUBSCRIPTION_LIMITS = {
  credits: {
    messages: Infinity, // No limits with credits, just balance
    images: Infinity,
    fileUploads: true,
    historyDays: Infinity,
  },
};
