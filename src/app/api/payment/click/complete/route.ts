import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

interface ClickCompleteRequest {
  click_trans_id: number;
  service_id: number;
  click_paydoc_id: number;
  merchant_trans_id: string;
  merchant_prepare_id: number;
  amount: number;
  action: number;
  error: number;
  error_note: string;
  sign_time: string;
  sign_string: string;
}

interface ClickCompleteResponse {
  click_trans_id: number;
  merchant_trans_id: string;
  merchant_confirm_id: number;
  error: number;
  error_note: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ClickCompleteRequest = await request.json();

    // Verify signature
    const secretKey = process.env.CLICK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_confirm_id: 0,
          error: -8,
          error_note: 'Server configuration error'
        } as ClickCompleteResponse,
        { status: 200 }
      );
    }

    // Verify signature — HMAC-SHA256 (MD5 emas, xavfsizroq)
    const signString = crypto
      .createHmac('sha256', secretKey)
      .update(
        `${body.click_trans_id}${body.service_id}${secretKey}${body.merchant_trans_id}${body.merchant_prepare_id}${body.amount}${body.action}${body.sign_time}`
      )
      .digest('hex');

    if (signString !== body.sign_string) {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_confirm_id: 0,
          error: -1,
          error_note: 'Invalid signature'
        } as ClickCompleteResponse,
        { status: 200 }
      );
    }

    const supabase = await createClient();

    // Get transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('id, status, amount_uzs')
      .eq('merchant_trans_id', body.merchant_trans_id)
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_confirm_id: 0,
          error: -5,
          error_note: 'Transaction not found'
        } as ClickCompleteResponse,
        { status: 200 }
      );
    }

    // Check if already completed
    if (transaction.status === 'completed') {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_confirm_id: parseInt(transaction.id.replace(/-/g, '').substring(0, 8), 16),
          error: -4,
          error_note: 'Already paid'
        } as ClickCompleteResponse,
        { status: 200 }
      );
    }

    // Check if cancelled
    if (transaction.status === 'cancelled') {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_confirm_id: 0,
          error: -9,
          error_note: 'Transaction cancelled'
        } as ClickCompleteResponse,
        { status: 200 }
      );
    }

    // If error from Click, mark as failed
    if (body.error < 0) {
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          error_message: body.error_note
        })
        .eq('id', transaction.id);

      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_confirm_id: 0,
          error: -9,
          error_note: body.error_note
        } as ClickCompleteResponse,
        { status: 200 }
      );
    }

    // Mark as completed (trigger will auto-enroll)
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        gateway_transaction_id: body.click_trans_id.toString(),
        gateway_payment_id: body.click_paydoc_id.toString()
      })
      .eq('id', transaction.id);

    if (updateError) {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_confirm_id: 0,
          error: -8,
          error_note: 'Failed to complete transaction'
        } as ClickCompleteResponse,
        { status: 200 }
      );
    }

    // Success
    return NextResponse.json(
      {
        click_trans_id: body.click_trans_id,
        merchant_trans_id: body.merchant_trans_id,
        merchant_confirm_id: parseInt(transaction.id.replace(/-/g, '').substring(0, 8), 16),
        error: 0,
        error_note: 'Success'
      } as ClickCompleteResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Click complete error:', error);
    return NextResponse.json(
      {
        click_trans_id: 0,
        merchant_trans_id: '',
        merchant_confirm_id: 0,
        error: -8,
        error_note: 'Internal server error'
      } as ClickCompleteResponse,
      { status: 200 }
    );
  }
}