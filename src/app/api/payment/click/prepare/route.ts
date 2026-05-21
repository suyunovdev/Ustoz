import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

interface ClickPrepareRequest {
  click_trans_id: number;
  service_id: number;
  click_paydoc_id: number;
  merchant_trans_id: string;
  amount: number;
  action: number;
  error: number;
  error_note: string;
  sign_time: string;
  sign_string: string;
}

interface ClickPrepareResponse {
  click_trans_id: number;
  merchant_trans_id: string;
  merchant_prepare_id: number;
  error: number;
  error_note: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ClickPrepareRequest = await request.json();

    // Verify signature
    const secretKey = process.env.CLICK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_prepare_id: 0,
          error: -8,
          error_note: 'Server configuration error'
        } as ClickPrepareResponse,
        { status: 200 }
      );
    }

    // Verify signature — HMAC-SHA256 (MD5 emas, xavfsizroq)
    const signString = crypto
      .createHmac('sha256', secretKey)
      .update(
        `${body.click_trans_id}${body.service_id}${secretKey}${body.merchant_trans_id}${body.amount}${body.action}${body.sign_time}`
      )
      .digest('hex');

    if (signString !== body.sign_string) {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_prepare_id: 0,
          error: -1,
          error_note: 'Invalid signature'
        } as ClickPrepareResponse,
        { status: 200 }
      );
    }

    const supabase = await createClient();

    // Check if transaction exists
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('id, status, amount_uzs, course_id, student_id')
      .eq('merchant_trans_id', body.merchant_trans_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_prepare_id: 0,
          error: -8,
          error_note: 'Database error'
        } as ClickPrepareResponse,
        { status: 200 }
      );
    }

    // Transaction not found
    if (!existingTransaction) {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_prepare_id: 0,
          error: -5,
          error_note: 'Transaction not found'
        } as ClickPrepareResponse,
        { status: 200 }
      );
    }

    // Check if already completed
    if (existingTransaction.status === 'completed') {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_prepare_id: parseInt(existingTransaction.id.replace(/-/g, '').substring(0, 8), 16),
          error: -4,
          error_note: 'Already paid'
        } as ClickPrepareResponse,
        { status: 200 }
      );
    }

    // Check if cancelled
    if (existingTransaction.status === 'cancelled') {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_prepare_id: 0,
          error: -9,
          error_note: 'Transaction cancelled'
        } as ClickPrepareResponse,
        { status: 200 }
      );
    }

    // Verify amount
    if (existingTransaction.amount_uzs !== body.amount) {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_prepare_id: 0,
          error: -2,
          error_note: 'Incorrect amount'
        } as ClickPrepareResponse,
        { status: 200 }
      );
    }

    // Update transaction status to processing
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'processing',
        click_trans_id: body.click_trans_id,
        click_paydoc_id: body.click_paydoc_id
      })
      .eq('id', existingTransaction.id);

    if (updateError) {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_prepare_id: 0,
          error: -8,
          error_note: 'Failed to update transaction'
        } as ClickPrepareResponse,
        { status: 200 }
      );
    }

    // Success
    return NextResponse.json(
      {
        click_trans_id: body.click_trans_id,
        merchant_trans_id: body.merchant_trans_id,
        merchant_prepare_id: parseInt(existingTransaction.id.replace(/-/g, '').substring(0, 8), 16),
        error: 0,
        error_note: 'Success'
      } as ClickPrepareResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Click prepare error:', error);
    return NextResponse.json(
      {
        click_trans_id: 0,
        merchant_trans_id: '',
        merchant_prepare_id: 0,
        error: -8,
        error_note: 'Internal server error'
      } as ClickPrepareResponse,
      { status: 200 }
    );
  }
}