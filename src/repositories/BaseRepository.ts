import { supabase } from '../database/supabase';

export class BaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected get client() {
    return supabase;
  }

  async getAll(): Promise<T[]> {
    const { data, error } = await this.client.from(this.tableName).select('*');
    if (error) {
      console.error(`Error fetching ${this.tableName}:`, error);
      return [];
    }
    return data as T[];
  }

  async getById(idColumn: string, idValue: number | string): Promise<T | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq(idColumn, idValue)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error(`Error fetching ${this.tableName} by id:`, error);
      return null;
    }
    return data as T | null;
  }
}
