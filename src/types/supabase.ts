export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      advogados: {
        Row: {
          ativo: boolean;
          created_at: string;
          email: string | null;
          id: string;
          nome: string;
          observacoes: string | null;
          owner_user_id: string;
          telefone: string | null;
          updated_at: string;
        };
        Insert: {
          ativo?: boolean;
          created_at?: string;
          email?: string | null;
          id?: string;
          nome: string;
          observacoes?: string | null;
          owner_user_id?: string;
          telefone?: string | null;
          updated_at?: string;
        };
        Update: {
          ativo?: boolean;
          created_at?: string;
          email?: string | null;
          id?: string;
          nome?: string;
          observacoes?: string | null;
          owner_user_id?: string;
          telefone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      clientes: {
        Row: {
          created_at: string;
          documento: string | null;
          email: string | null;
          id: string;
          nome: string;
          observacoes: string | null;
          owner_user_id: string;
          telefone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          documento?: string | null;
          email?: string | null;
          id?: string;
          nome: string;
          observacoes?: string | null;
          owner_user_id?: string;
          telefone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          documento?: string | null;
          email?: string | null;
          id?: string;
          nome?: string;
          observacoes?: string | null;
          owner_user_id?: string;
          telefone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      templates_fluxo: {
        Row: {
          ativo: boolean;
          advogado_id: string | null;
          created_at: string;
          id: string;
          nome: string;
          observacoes: string | null;
          owner_user_id: string;
          tipo_servico: string;
          updated_at: string;
          versao: number;
        };
        Insert: {
          ativo?: boolean;
          advogado_id?: string | null;
          created_at?: string;
          id?: string;
          nome: string;
          observacoes?: string | null;
          owner_user_id?: string;
          tipo_servico: string;
          updated_at?: string;
          versao?: number;
        };
        Update: {
          ativo?: boolean;
          advogado_id?: string | null;
          created_at?: string;
          id?: string;
          nome?: string;
          observacoes?: string | null;
          owner_user_id?: string;
          tipo_servico?: string;
          updated_at?: string;
          versao?: number;
        };
        Relationships: [
          {
            foreignKeyName: "templates_fluxo_advogado_id_fkey";
            columns: ["advogado_id"];
            isOneToOne: false;
            referencedRelation: "advogados";
            referencedColumns: ["id"];
          },
        ];
      };
      etapas_template: {
        Row: {
          created_at: string;
          descricao: string | null;
          id: string;
          nome: string;
          obrigatoria: boolean;
          observacoes: string | null;
          ordem: number;
          owner_user_id: string;
          prazo_padrao_dias: number | null;
          template_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          descricao?: string | null;
          id?: string;
          nome: string;
          obrigatoria?: boolean;
          observacoes?: string | null;
          ordem: number;
          owner_user_id?: string;
          prazo_padrao_dias?: number | null;
          template_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          descricao?: string | null;
          id?: string;
          nome?: string;
          obrigatoria?: boolean;
          observacoes?: string | null;
          ordem?: number;
          owner_user_id?: string;
          prazo_padrao_dias?: number | null;
          template_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "etapas_template_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "templates_fluxo";
            referencedColumns: ["id"];
          },
        ];
      };
      demandas: {
        Row: {
          advogado_id: string;
          cliente_id: string;
          created_at: string;
          data_conclusao: string | null;
          data_criacao: string;
          id: string;
          numero_processo: string | null;
          observacoes: string | null;
          owner_user_id: string;
          prazo_final: string | null;
          status: Database["public"]["Enums"]["status_demanda"];
          template_id: string;
          titulo: string;
          updated_at: string;
        };
        Insert: {
          advogado_id: string;
          cliente_id: string;
          created_at?: string;
          data_conclusao?: string | null;
          data_criacao?: string;
          id?: string;
          numero_processo?: string | null;
          observacoes?: string | null;
          owner_user_id?: string;
          prazo_final?: string | null;
          status?: Database["public"]["Enums"]["status_demanda"];
          template_id: string;
          titulo: string;
          updated_at?: string;
        };
        Update: {
          advogado_id?: string;
          cliente_id?: string;
          created_at?: string;
          data_conclusao?: string | null;
          data_criacao?: string;
          id?: string;
          numero_processo?: string | null;
          observacoes?: string | null;
          owner_user_id?: string;
          prazo_final?: string | null;
          status?: Database["public"]["Enums"]["status_demanda"];
          template_id?: string;
          titulo?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "demandas_advogado_id_fkey";
            columns: ["advogado_id"];
            isOneToOne: false;
            referencedRelation: "advogados";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "demandas_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "demandas_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "templates_fluxo";
            referencedColumns: ["id"];
          },
        ];
      };
      etapas_demanda: {
        Row: {
          created_at: string;
          data_conclusao: string | null;
          data_inicio: string | null;
          demanda_id: string;
          descricao: string | null;
          etapa_origem_id: string | null;
          id: string;
          nome: string;
          obrigatoria: boolean;
          observacoes: string | null;
          ordem: number;
          owner_user_id: string;
          prazo: string | null;
          status: Database["public"]["Enums"]["status_etapa_demanda"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          data_conclusao?: string | null;
          data_inicio?: string | null;
          demanda_id: string;
          descricao?: string | null;
          etapa_origem_id?: string | null;
          id?: string;
          nome: string;
          obrigatoria?: boolean;
          observacoes?: string | null;
          ordem: number;
          owner_user_id?: string;
          prazo?: string | null;
          status?: Database["public"]["Enums"]["status_etapa_demanda"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          data_conclusao?: string | null;
          data_inicio?: string | null;
          demanda_id?: string;
          descricao?: string | null;
          etapa_origem_id?: string | null;
          id?: string;
          nome?: string;
          obrigatoria?: boolean;
          observacoes?: string | null;
          ordem?: number;
          owner_user_id?: string;
          prazo?: string | null;
          status?: Database["public"]["Enums"]["status_etapa_demanda"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "etapas_demanda_demanda_id_fkey";
            columns: ["demanda_id"];
            isOneToOne: false;
            referencedRelation: "demandas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "etapas_demanda_etapa_origem_id_fkey";
            columns: ["etapa_origem_id"];
            isOneToOne: false;
            referencedRelation: "etapas_template";
            referencedColumns: ["id"];
          },
        ];
      };
      historico: {
        Row: {
          acao: string;
          created_at: string;
          data: string;
          demanda_id: string;
          descricao: string;
          etapa_id: string | null;
          id: string;
          owner_user_id: string;
        };
        Insert: {
          acao: string;
          created_at?: string;
          data?: string;
          demanda_id: string;
          descricao: string;
          etapa_id?: string | null;
          id?: string;
          owner_user_id?: string;
        };
        Update: {
          acao?: string;
          created_at?: string;
          data?: string;
          demanda_id?: string;
          descricao?: string;
          etapa_id?: string | null;
          id?: string;
          owner_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "historico_demanda_id_fkey";
            columns: ["demanda_id"];
            isOneToOne: false;
            referencedRelation: "demandas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "historico_etapa_id_fkey";
            columns: ["etapa_id"];
            isOneToOne: false;
            referencedRelation: "etapas_demanda";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      atualizar_prazo_etapa: {
        Args: { p_etapa_demanda_id: string; p_novo_prazo: string | null };
        Returns: undefined;
      };
      atualizar_status_etapa: {
        Args: {
          p_etapa_demanda_id: string;
          p_novo_status: Database["public"]["Enums"]["status_etapa_demanda"];
          p_observacoes?: string | null;
        };
        Returns: undefined;
      };
      criar_demanda_por_template: {
        Args: {
          p_template_id: string;
          p_advogado_id: string;
          p_cliente_id: string;
          p_titulo: string;
          p_numero_processo?: string | null;
          p_prazo_final?: string | null;
          p_observacoes?: string | null;
        };
        Returns: string;
      };
      finalizar_demanda: {
        Args: { p_demanda_id: string; p_justificativa?: string | null };
        Returns: undefined;
      };
    };
    Enums: {
      status_demanda:
        | "nao_iniciada"
        | "em_andamento"
        | "aguardando_retorno"
        | "finalizada"
        | "cancelada";
      status_etapa_demanda:
        | "nao_iniciada"
        | "em_andamento"
        | "concluida"
        | "bloqueada"
        | "cancelada"
        | "aguardando_terceiro";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
