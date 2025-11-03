import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorHandler';

export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

// =====================================================
// SUPPLIERS
// =====================================================

export const fetchSuppliers = async (): Promise<ServiceResult<any[]>> => {
  try {
    console.log('vouchers.service: Fetching suppliers');
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) {
      console.error('vouchers.service: Supabase error fetching suppliers:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('vouchers.service: Suppliers fetched successfully');
    return { data, error: null };
  } catch (error) {
    console.error('vouchers.service: Error fetching suppliers:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const fetchActiveSuppliers = async (): Promise<ServiceResult<any[]>> => {
  try {
    console.log('vouchers.service: Fetching active suppliers');
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('vouchers.service: Supabase error fetching active suppliers:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('vouchers.service: Active suppliers fetched successfully');
    return { data, error: null };
  } catch (error) {
    console.error('vouchers.service: Error fetching active suppliers:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const createSupplier = async (supplierData: any): Promise<ServiceResult<any>> => {
  try {
    console.log('vouchers.service: Creating supplier');
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single();

    if (error) {
      console.error('vouchers.service: Supabase error creating supplier:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('vouchers.service: Supplier created successfully');
    return { data, error: null };
  } catch (error) {
    console.error('vouchers.service: Error creating supplier:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const updateSupplier = async (supplierId: string, supplierData: any): Promise<ServiceResult<any>> => {
  try {
    console.log('vouchers.service: Updating supplier:', supplierId);
    const { data, error } = await supabase
      .from('suppliers')
      .update(supplierData)
      .eq('id', supplierId)
      .select()
      .single();

    if (error) {
      console.error('vouchers.service: Supabase error updating supplier:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('vouchers.service: Supplier updated successfully');
    return { data, error: null };
  } catch (error) {
    console.error('vouchers.service: Error updating supplier:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const deleteSupplier = async (supplierId: string): Promise<ServiceResult<any>> => {
  try {
    console.log('vouchers.service: Deleting supplier:', supplierId);
    const { data, error } = await supabase
      .from('suppliers')
      .update({ active: false })
      .eq('id', supplierId)
      .select()
      .single();

    if (error) {
      console.error('vouchers.service: Supabase error deleting supplier:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('vouchers.service: Supplier deleted successfully');
    return { data, error: null };
  } catch (error) {
    console.error('vouchers.service: Error deleting supplier:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

// =====================================================
// VOUCHERS
// =====================================================

export const fetchVouchers = async (): Promise<ServiceResult<any[]>> => {
  try {
    console.log('vouchers.service: Fetching vouchers');
    const { data, error } = await supabase
      .from('vouchers')
      .select(`
        *,
        suppliers!supplier_id(*),
        profiles!user_id(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('vouchers.service: Supabase error fetching vouchers:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('vouchers.service: Vouchers fetched successfully');
    return { data, error: null };
  } catch (error) {
    console.error('vouchers.service: Error fetching vouchers:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const fetchVoucherById = async (voucherId: string): Promise<ServiceResult<any>> => {
  try {
    console.log('vouchers.service: Fetching voucher by ID:', voucherId);
    const { data, error } = await supabase
      .from('vouchers')
      .select(`
        *,
        suppliers!supplier_id(*),
        profiles!user_id(*),
        voucher_items(
          *,
          products(*)
        )
      `)
      .eq('id', voucherId)
      .single();

    if (error) {
      console.error('vouchers.service: Supabase error fetching voucher:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('vouchers.service: Voucher fetched successfully');
    return { data, error: null };
  } catch (error) {
    console.error('vouchers.service: Error fetching voucher:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const createVoucher = async (voucherData: any, items: any[]): Promise<ServiceResult<any>> => {
  try {
    console.log('vouchers.service: Creating voucher');

    // Create the voucher first
    const { data: voucher, error: voucherError } = await supabase
      .from('vouchers')
      .insert(voucherData)
      .select()
      .single();

    if (voucherError) {
      console.error('vouchers.service: Supabase error creating voucher:', voucherError);
      return { data: null, error: getErrorMessage(voucherError) };
    }

    // Create voucher items
    const voucherItems = items.map((item) => ({
      voucher_id: voucher.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      subtotal: item.quantity * item.unit_cost,
    }));

    const { error: itemsError } = await supabase
      .from('voucher_items')
      .insert(voucherItems);

    if (itemsError) {
      console.error('vouchers.service: Supabase error creating voucher items:', itemsError);
      // Rollback: Delete the voucher
      await supabase.from('vouchers').delete().eq('id', voucher.id);
      return { data: null, error: getErrorMessage(itemsError) };
    }

    console.log('vouchers.service: Voucher created successfully');
    return { data: voucher, error: null };
  } catch (error) {
    console.error('vouchers.service: Error creating voucher:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const updateVoucher = async (voucherId: string, voucherData: any): Promise<ServiceResult<any>> => {
  try {
    console.log('vouchers.service: Updating voucher:', voucherId);
    const { data, error } = await supabase
      .from('vouchers')
      .update(voucherData)
      .eq('id', voucherId)
      .select()
      .single();

    if (error) {
      console.error('vouchers.service: Supabase error updating voucher:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('vouchers.service: Voucher updated successfully');
    return { data, error: null };
  } catch (error) {
    console.error('vouchers.service: Error updating voucher:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const receiveVoucher = async (voucherId: string, createPayable: boolean = true): Promise<ServiceResult<any>> => {
  try {
    console.log('vouchers.service: Receiving voucher:', voucherId);
    const { data, error } = await supabase.rpc('receive_voucher_items', {
      p_voucher_id: voucherId,
      p_create_payable: createPayable,
    });

    if (error) {
      console.error('vouchers.service: Supabase error receiving voucher:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('vouchers.service: Voucher received successfully');
    return { data, error: null };
  } catch (error) {
    console.error('vouchers.service: Error receiving voucher:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const cancelVoucher = async (voucherId: string): Promise<ServiceResult<any>> => {
  try {
    console.log('vouchers.service: Cancelling voucher:', voucherId);
    const { data, error } = await supabase
      .from('vouchers')
      .update({ status: 'cancelled' })
      .eq('id', voucherId)
      .select()
      .single();

    if (error) {
      console.error('vouchers.service: Supabase error cancelling voucher:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('vouchers.service: Voucher cancelled successfully');
    return { data, error: null };
  } catch (error) {
    console.error('vouchers.service: Error cancelling voucher:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

// =====================================================
// ACCOUNTS PAYABLE
// =====================================================

export const fetchAccountsPayable = async (): Promise<ServiceResult<any[]>> => {
  try {
    console.log('vouchers.service: Fetching accounts payable');
    const { data, error } = await supabase
      .from('accounts_payable')
      .select(`
        *,
        suppliers!supplier_id(*),
        vouchers!voucher_id(voucher_number, status)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('vouchers.service: Supabase error fetching accounts payable:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('vouchers.service: Accounts payable fetched successfully');
    return { data, error: null };
  } catch (error) {
    console.error('vouchers.service: Error fetching accounts payable:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const fetchAccountsPayableBySupplier = async (supplierId: string): Promise<ServiceResult<any[]>> => {
  try {
    console.log('vouchers.service: Fetching accounts payable for supplier:', supplierId);
    const { data, error } = await supabase
      .from('accounts_payable')
      .select(`
        *,
        suppliers!supplier_id(*),
        vouchers!voucher_id(voucher_number, status)
      `)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('vouchers.service: Supabase error fetching accounts payable:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('vouchers.service: Accounts payable fetched successfully');
    return { data, error: null };
  } catch (error) {
    console.error('vouchers.service: Error fetching accounts payable:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const updatePayablePayment = async (payableId: string, paymentAmount: number): Promise<ServiceResult<any>> => {
  try {
    console.log('vouchers.service: Updating payable payment:', payableId);
    const { data, error } = await supabase.rpc('update_payable_payment', {
      p_payable_id: payableId,
      p_payment_amount: paymentAmount,
    });

    if (error) {
      console.error('vouchers.service: Supabase error updating payable payment:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('vouchers.service: Payable payment updated successfully');
    return { data, error: null };
  } catch (error) {
    console.error('vouchers.service: Error updating payable payment:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export const generateVoucherNumber = async (): Promise<ServiceResult<string>> => {
  try {
    const prefix = 'VCH';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const voucherNumber = `${prefix}-${timestamp}-${random}`;

    return { data: voucherNumber, error: null };
  } catch (error) {
    console.error('vouchers.service: Error generating voucher number:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};
