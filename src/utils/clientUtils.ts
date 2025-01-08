import { supabase, getClient, type ClientContext } from '../lib/supabase';
import type { ClientInfo } from '../types/auth';
import type { Database } from '../types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

type ClientResponse = {
  data: ClientInfo | null;
  error: string | null;
};

type ClientsResponse = {
  data: ClientInfo[];
  error: string | null;
};

export async function createClient(
  name: string,
  email: string,
  company?: string
): Promise<ClientResponse> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name,
        email,
        company,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      data: {
        id: data.id,
        name: data.name,
        email: data.email,
        company: data.company ?? undefined,
        active: data.active,
        created_at: data.created_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error creating client:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

export async function updateClient(
  id: string,
  updates: Partial<Omit<ClientInfo, 'id' | 'created_at'>>
): Promise<ClientResponse> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      data: {
        id: data.id,
        name: data.name,
        email: data.email,
        company: data.company ?? undefined,
        active: data.active,
        created_at: data.created_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error updating client:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

export async function getClientById(id: string): Promise<ClientResponse> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      data: {
        id: data.id,
        name: data.name,
        email: data.email,
        company: data.company ?? undefined,
        active: data.active,
        created_at: data.created_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error getting client:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

export async function getAllClients(token?: string): Promise<ClientsResponse> {
  try {
    const client = getClient({ requiresAdmin: true }) as SupabaseClient<Database>;
    
    if (token) {
      await client.auth.setSession({ access_token: token, refresh_token: '' });
    }

    const { data, error } = await client
      .from('clients')
      .select('*')
      .order('name');

    if (error) throw error;

    return {
      data: data.map((clientData: Database['public']['Tables']['clients']['Row']) => ({
        id: clientData.id,
        name: clientData.name,
        email: clientData.email,
        company: clientData.company ?? undefined,
        active: clientData.active,
        created_at: clientData.created_at,
      })),
      error: null,
    };
  } catch (error) {
    console.error('Error getting clients:', error);
    return {
      data: [],
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

export async function deactivateClient(
  id: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('clients')
      .update({ active: false })
      .eq('id', id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deactivating client:', error);
    return {
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

export async function activateClient(
  id: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('clients')
      .update({ active: true })
      .eq('id', id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error activating client:', error);
    return {
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}
