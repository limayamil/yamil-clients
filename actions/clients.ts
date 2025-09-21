'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { createClientSchema, updateClientSchema } from '@/lib/validators/clients';
import { requireRole } from '@/lib/auth/guards';
import { audit } from '@/lib/observability/audit';

export async function createClient(_: unknown, formData: FormData) {
  try {
    const user = await requireRole(['provider']);
    const supabase = createSupabaseServerClient();

    const payload = Object.fromEntries(formData.entries());
    const parsed = createClientSchema.safeParse(payload);

    if (!parsed.success) {
      return {
        error: parsed.error.flatten().fieldErrors
      };
    }

    const { data, error } = await supabase
      .from('clients')
      .insert([parsed.data])
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return {
        error: { database: ['Error al crear el cliente'] }
      };
    }

    await audit({
      action: 'client.create',
      actorType: 'provider',
      details: {
        clientId: data.id,
        clientName: data.name,
        clientEmail: data.email,
        createdBy: user.id
      }
    });

    revalidatePath('/dashboard');
    revalidatePath('/clients');

    return { success: true, data };
  } catch (error) {
    console.error('Error in createClient:', error);
    return {
      error: { server: ['Error interno del servidor'] }
    };
  }
}

export async function updateClient(_: unknown, formData: FormData) {
  try {
    await requireRole(['provider']);
    const supabase = createSupabaseServerClient();

    const payload = Object.fromEntries(formData.entries());
    const parsed = updateClientSchema.safeParse(payload);

    if (!parsed.success) {
      return {
        error: parsed.error.flatten().fieldErrors
      };
    }

    const { id, ...updateData } = parsed.data;
    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return {
        error: { database: ['Error al actualizar el cliente'] }
      };
    }

    await audit({
      action: 'client.update',
      actorType: 'provider',
      details: {
        clientId: data.id,
        clientName: data.name,
        updatedFields: Object.keys(updateData)
      }
    });

    revalidatePath('/dashboard');
    revalidatePath('/clients');

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateClient:', error);
    return {
      error: { server: ['Error interno del servidor'] }
    };
  }
}

export async function toggleClientStatus(clientId: string) {
  try {
    await requireRole(['provider']);
    const supabase = createSupabaseServerClient();

    const { data: currentClient, error: fetchError } = await supabase
      .from('clients')
      .select('id, active, name')
      .eq('id', clientId)
      .single();

    if (fetchError || !currentClient) {
      console.error('Error fetching client:', fetchError);
      return {
        error: { database: ['Cliente no encontrado'] }
      };
    }

    const { data, error } = await supabase
      .from('clients')
      .update({ active: !currentClient.active })
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling client status:', error);
      return {
        error: { database: ['Error al cambiar el estado del cliente'] }
      };
    }

    await audit({
      action: 'client.toggle_status',
      actorType: 'provider',
      details: {
        clientId: data.id,
        clientName: data.name,
        newStatus: data.active ? 'active' : 'inactive'
      }
    });

    revalidatePath('/dashboard');
    revalidatePath('/clients');

    return { success: true, data };
  } catch (error) {
    console.error('Error in toggleClientStatus:', error);
    return {
      error: { server: ['Error interno del servidor'] }
    };
  }
}