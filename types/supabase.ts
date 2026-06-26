// Tipos del modelo de datos Reviu (Fase 1).
// Escritos a mano provisionalmente — sustituir por `supabase gen types typescript`
// cuando la CLI esté configurada. Reflejan supabase/migrations/0001_initial_schema.sql.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ObjectStatus =
  | "draft"
  | "published"
  | "reserved"
  | "completed"
  | "withdrawn";

export type ExchangeStatus =
  | "requested"
  | "accepted"
  | "rejected"
  | "completed"
  | "cancelled";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          neighborhood: string | null;
          city: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          neighborhood?: string | null;
          city?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          neighborhood?: string | null;
          city?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon: string | null;
          parent_id: string | null;
          active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          parent_id?: string | null;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          parent_id?: string | null;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      destinations: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          id: string;
          owner_id: string;
          category_id: string;
          destination_id: string;
          title: string;
          description: string | null;
          neighborhood: string | null;
          city: string;
          approx_lat: number | null;
          approx_lng: number | null;
          status: ObjectStatus;
          validated_by: string | null;
          validated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          category_id: string;
          destination_id: string;
          title: string;
          description?: string | null;
          neighborhood?: string | null;
          city?: string;
          approx_lat?: number | null;
          approx_lng?: number | null;
          status?: ObjectStatus;
          validated_by?: string | null;
          validated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          category_id?: string;
          destination_id?: string;
          title?: string;
          description?: string | null;
          neighborhood?: string | null;
          city?: string;
          approx_lat?: number | null;
          approx_lng?: number | null;
          status?: ObjectStatus;
          validated_by?: string | null;
          validated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      object_photos: {
        Row: {
          id: string;
          object_id: string;
          storage_path: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          object_id: string;
          storage_path: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          object_id?: string;
          storage_path?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      exchanges: {
        Row: {
          id: string;
          object_id: string;
          giver_id: string;
          receiver_id: string;
          status: ExchangeStatus;
          message: string | null;
          destination_neighborhood: string | null;
          requested_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          object_id: string;
          giver_id: string;
          receiver_id: string;
          status?: ExchangeStatus;
          message?: string | null;
          destination_neighborhood?: string | null;
          requested_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          object_id?: string;
          giver_id?: string;
          receiver_id?: string;
          status?: ExchangeStatus;
          message?: string | null;
          destination_neighborhood?: string | null;
          requested_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      impact: {
        Row: {
          id: string;
          profile_id: string;
          exchange_id: string | null;
          object_id: string | null;
          destination_id: string | null;
          co2_saved_kg: number;
          waste_diverted_kg: number;
          objects_count: number;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          exchange_id?: string | null;
          object_id?: string | null;
          destination_id?: string | null;
          co2_saved_kg?: number;
          waste_diverted_kg?: number;
          objects_count?: number;
          occurred_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          exchange_id?: string | null;
          object_id?: string | null;
          destination_id?: string | null;
          co2_saved_kg?: number;
          waste_diverted_kg?: number;
          objects_count?: number;
          occurred_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      object_status: ObjectStatus;
      exchange_status: ExchangeStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
