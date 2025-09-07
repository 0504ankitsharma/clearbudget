import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  description: string;
  created_at: string;
}

export async function saveTransaction(
  userId: string, 
  amount: number, 
  category: string, 
  type: 'income' | 'expense', 
  description: string
) {
  return await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      amount,
      category,
      type,
      description,
    });
}

export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function updateTransaction(
  transactionId: string,
  userId: string,
  amount: number,
  category: string,
  type: 'income' | 'expense',
  description: string
) {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      amount,
      category,
      type,
      description,
    })
    .eq('id', transactionId)
    .eq('user_id', userId) // Ensure user can only update their own transactions
    .select();
  
  if (error) throw error;
  return data?.[0];
}

export async function deleteTransaction(transactionId: string, userId: string) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', userId); // Ensure user can only delete their own transactions
  
  if (error) throw error;
  return true;
}
