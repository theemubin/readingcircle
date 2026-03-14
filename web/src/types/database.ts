// Auto-generated types from Supabase schema
// Run: npx supabase gen types typescript --local > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          role: 'student' | 'campus_poc' | 'admin'
          campus_id: string | null
          xp_total: number
          streak_current: number
          streak_longest: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at' | 'xp_total' | 'streak_current' | 'streak_longest'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
              Relationships: []
      }
      books: {
        Row: {
          id: string
          title: string
          author: string | null
          description: string | null
          cover_url: string | null
          epub_url: string | null
          epub_size_bytes: number | null
          total_positions: number | null
          campus_id: string | null
          created_by: string | null
          status: 'draft' | 'published' | 'archived'
          genre: string[] | null
          language: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['books']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['books']['Insert']>
              Relationships: []
      }
      bookmarks: {
        Row: {
          id: string
          student_id: string
          book_id: string
          cfi: string
          label: string | null
          color: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bookmarks']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bookmarks']['Insert']>
              Relationships: []
      }
      reader_preferences: {
        Row: {
          user_id: string
          font_family: string
          font_size: number
          line_spacing: 'compact' | 'normal' | 'relaxed' | 'spacious'
          theme: 'light' | 'sepia' | 'dark' | 'night'
          margin_size: number
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['reader_preferences']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['reader_preferences']['Insert']>
              Relationships: []
      }
      reading_sessions: {
        Row: {
          id: string
          student_id: string
          book_id: string
          started_at: string
          ended_at: string | null
          duration_seconds: number
          start_cfi: string | null
          end_cfi: string | null
          progress_percent: number
          words_looked_up: number
          xp_earned: number
          state: 'active' | 'paused' | 'completed'
        }
        Insert: Omit<Database['public']['Tables']['reading_sessions']['Row'], 'id' | 'started_at' | 'duration_seconds' | 'words_looked_up' | 'xp_earned' | 'state'>
        Update: Partial<Database['public']['Tables']['reading_sessions']['Insert']>
              Relationships: []
      }
      saved_words: {
        Row: {
          id: string
          student_id: string
          book_id: string | null
          word: string
          definition: string | null
          context_sentence: string | null
          cfi: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['saved_words']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['saved_words']['Insert']>
              Relationships: []
      }
      weekly_goals: {
        Row: {
          id: string
          student_id: string
          week_start: string
          target_minutes: number
          target_words: number
          target_pages: number
          actual_minutes: number
          actual_words: number
          actual_pages: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['weekly_goals']['Row'], 'id' | 'created_at' | 'updated_at' | 'actual_minutes' | 'actual_words' | 'actual_pages'>
        Update: Partial<Database['public']['Tables']['weekly_goals']['Insert']>
              Relationships: []
      }
      streaks: {
        Row: {
          student_id: string
          current_streak: number
          longest_streak: number
          last_active_date: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['streaks']['Row'], 'updated_at' | 'current_streak' | 'longest_streak'>
        Update: Partial<Database['public']['Tables']['streaks']['Insert']>
              Relationships: []
      }
      xp_events: {
        Row: {
          id: string
          student_id: string
          source: string
          xp_amount: number
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['xp_events']['Row'], 'id' | 'created_at'>
        Update: never
              Relationships: []
      }
      badges: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          icon_url: string | null
          xp_reward: number
          condition_type: string
          condition_value: number
        }
        Insert: Database['public']['Tables']['badges']['Row']
        Update: Partial<Database['public']['Tables']['badges']['Row']>
              Relationships: []
      }
      student_badges: {
        Row: {
          student_id: string
          badge_id: string
          earned_at: string
        }
        Insert: Omit<Database['public']['Tables']['student_badges']['Row'], 'earned_at'>
        Update: never
              Relationships: []
      }
      quests: {
        Row: {
          id: string
          student_id: string
          quest_type: string
          title: string
          description: string | null
          target_value: number
          current_value: number
          xp_reward: number
          expires_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['quests']['Row'], 'id' | 'current_value' | 'created_at' | 'completed_at'>
        Update: Partial<Database['public']['Tables']['quests']['Insert']>
              Relationships: []
      }
      friend_requests: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['friend_requests']['Row'], 'id' | 'created_at' | 'updated_at' | 'status'>
        Update: Partial<Database['public']['Tables']['friend_requests']['Insert']>
              Relationships: []
      }
      friendships: {
        Row: {
          user_a: string
          user_b: string
          created_at: string
        }
        Insert: Database['public']['Tables']['friendships']['Row']
        Update: never
              Relationships: []
      }
      blocks: {
        Row: {
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: Database['public']['Tables']['blocks']['Row']
        Update: never
              Relationships: []
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          read_at: string | null
          deleted_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at' | 'read_at' | 'deleted_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
              Relationships: []
      }
      wall_posts: {
        Row: {
          id: string
          author_id: string
          post_type: 'user_post' | 'achievement'
          content: string | null
          image_url: string | null
          badge_id: string | null
          book_id: string | null
          visibility: 'friends' | 'campus' | 'public'
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['wall_posts']['Row'], 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Database['public']['Tables']['wall_posts']['Insert']>
              Relationships: []
      }
      post_reactions: {
        Row: {
          post_id: string
          user_id: string
          reaction: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['post_reactions']['Row'], 'created_at'>
        Update: never
              Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'friend_request' | 'friend_accepted' | 'new_message' | 'post_reaction' | 'achievement_post'
          payload: Json | null
          read_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'read_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
              Relationships: []
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          book_id: string | null
          session_id: string | null
          messages: Json
          model: string
          total_tokens: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_conversations']['Row'], 'id' | 'created_at' | 'updated_at' | 'total_tokens'>
        Update: Partial<Database['public']['Tables']['ai_conversations']['Insert']>
              Relationships: []
      }
      ai_usage_logs: {
        Row: {
          id: string
          user_id: string
          conversation_id: string | null
          prompt_tokens: number
          completion_tokens: number
          model: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_usage_logs']['Row'], 'id' | 'created_at'>
        Update: never
              Relationships: []
      }
    }
    Views: {
      student_levels: {
        Row: {
          student_id: string
          total_xp: number
          level: number
          xp_for_next_level: number
        }
      }
      ai_daily_usage: {
        Row: {
          user_id: string
          usage_date: string
          total_tokens: number
          request_count: number
        }
      }
    }
    Functions: {
      are_friends: { Args: { uid1: string; uid2: string }; Returns: boolean }
      is_blocked: { Args: { uid1: string; uid2: string }; Returns: boolean }
      current_user_role: { Args: Record<string, never>; Returns: 'student' | 'campus_poc' | 'admin' }
    }
    Enums: {
      user_role: 'student' | 'campus_poc' | 'admin'
      book_status: 'draft' | 'published' | 'archived'
      session_state: 'active' | 'paused' | 'completed'
      activity_event_type: 'word_lookup' | 'bookmark' | 'highlight' | 'note' | 'ai_query'
      reader_theme: 'light' | 'sepia' | 'dark' | 'night'
      line_spacing: 'compact' | 'normal' | 'relaxed' | 'spacious'
      learning_stage: 'new' | 'learning' | 'review' | 'mastered'
      wall_post_type: 'user_post' | 'achievement'
      post_visibility: 'friends' | 'campus' | 'public'
      notification_type: 'friend_request' | 'friend_accepted' | 'new_message' | 'post_reaction' | 'achievement_post'
    }
  }
}
