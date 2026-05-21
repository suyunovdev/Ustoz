import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';


interface PaymeRequest {
  method: string;
  params: {
    id?: string;
    account?: {
      order_id?: string;
    };
    amount?: number;
    time?: number;
    reason?: number;
  };
  id: number;
}

interface PaymeResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: string;
  };
  id: number;
}

function createPaymeError(code: number, message: string, id: number, data?: string): NextResponse {
  return NextResponse.json({
    error: {
      code,
      message,
      data
    },
    id
  } as PaymeResponse);
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return createPaymeError(-32504, 'Insufficient privilege to perform this method', 0);
    }

    const paymeKey = process.env.PAYME_KEY;
    const paymeMerchantId = process.env.PAYME_MERCHANT_ID;

    if (!paymeKey || !paymeMerchantId) {
      return createPaymeError(-32400, 'Server configuration error', 0);
    }

    // Verify Basic Auth
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    const expectedAuth = `Payme:${paymeKey}`;
    const providedAuth = `${username}:${password}`;

    if (providedAuth !== expectedAuth) {
      return createPaymeError(-32504, 'Insufficient privilege to perform this method', 0);
    }

    const body: PaymeRequest = await request.json();
    const supabase = await createClient();

    switch (body.method) {
      case 'CheckPerformTransaction': {
        const orderId = body.params.account?.order_id;
        const amount = body.params.amount;

        if (!orderId) {
          return createPaymeError(-31050, 'Order not found', body.id);
        }

        // Get transaction
        const { data: transaction, error } = await supabase
          .from('payment_transactions')
          .select('id, status, amount_uzs, student_id, course_id')
          .eq('merchant_trans_id', orderId)
          .single();

        if (error || !transaction) {
          return createPaymeError(-31050, 'Order not found', body.id);
        }

        // Check if already paid
        if (transaction.status === 'completed') {
          return createPaymeError(-31051, 'Order already paid', body.id);
        }

        // Check if cancelled
        if (transaction.status === 'cancelled') {
          return createPaymeError(-31099, 'Order cancelled', body.id);
        }

        // Verify amount (Payme sends amount in tiyin, we store in som)
        const expectedAmount = transaction.amount_uzs * 100;
        if (amount !== expectedAmount) {
          return createPaymeError(-31001, 'Incorrect amount', body.id);
        }

        return NextResponse.json({
          result: {
            allow: true
          },
          id: body.id
        } as PaymeResponse);
      }

      case 'CreateTransaction': {
        const orderId = body.params.account?.order_id;
        const amount = body.params.amount;
        const transactionId = body.params.id;
        const time = body.params.time;

        if (!orderId || !transactionId) {
          return createPaymeError(-31050, 'Order not found', body.id);
        }

        // Get transaction
        const { data: transaction, error } = await supabase
          .from('payment_transactions')
          .select('id, status, amount_uzs, payme_transaction_id')
          .eq('merchant_trans_id', orderId)
          .single();

        if (error || !transaction) {
          return createPaymeError(-31050, 'Order not found', body.id);
        }

        // Check if transaction already exists with different ID
        if (transaction.payme_transaction_id && transaction.payme_transaction_id !== transactionId) {
          return createPaymeError(-31099, 'Transaction already exists', body.id);
        }

        // If already processing with same ID, return existing
        if (transaction.payme_transaction_id === transactionId) {
          return NextResponse.json({
            result: {
              create_time: time,
              transaction: transaction.id,
              state: transaction.status === 'completed' ? 2 : 1
            },
            id: body.id
          } as PaymeResponse);
        }

        // Update transaction
        const { error: updateError } = await supabase
          .from('payment_transactions')
          .update({
            status: 'processing',
            payme_transaction_id: transactionId,
            payme_time: time
          })
          .eq('id', transaction.id);

        if (updateError) {
          return createPaymeError(-31008, 'Failed to create transaction', body.id);
        }

        return NextResponse.json({
          result: {
            create_time: time,
            transaction: transaction.id,
            state: 1
          },
          id: body.id
        } as PaymeResponse);
      }

      case 'PerformTransaction': {
        const transactionId = body.params.id;

        if (!transactionId) {
          return createPaymeError(-31003, 'Transaction not found', body.id);
        }

        // Get transaction by payme_transaction_id
        const { data: transaction, error } = await supabase
          .from('payment_transactions')
          .select('id, status, payme_time')
          .eq('payme_transaction_id', transactionId)
          .single();

        if (error || !transaction) {
          return createPaymeError(-31003, 'Transaction not found', body.id);
        }

        // Check if already completed
        if (transaction.status === 'completed') {
          return NextResponse.json({
            result: {
              transaction: transaction.id,
              perform_time: Date.now(),
              state: 2
            },
            id: body.id
          } as PaymeResponse);
        }

        // Mark as completed (trigger will auto-enroll)
        const performTime = Date.now();
        const { error: updateError } = await supabase
          .from('payment_transactions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', transaction.id);

        if (updateError) {
          return createPaymeError(-31008, 'Failed to perform transaction', body.id);
        }

        return NextResponse.json({
          result: {
            transaction: transaction.id,
            perform_time: performTime,
            state: 2
          },
          id: body.id
        } as PaymeResponse);
      }

      case 'CancelTransaction': {
        const transactionId = body.params.id;
        const reason = body.params.reason;

        if (!transactionId) {
          return createPaymeError(-31003, 'Transaction not found', body.id);
        }

        // Get transaction
        const { data: transaction, error } = await supabase
          .from('payment_transactions')
          .select('id, status, payme_time')
          .eq('payme_transaction_id', transactionId)
          .single();

        if (error || !transaction) {
          return createPaymeError(-31003, 'Transaction not found', body.id);
        }

        // If already cancelled
        if (transaction.status === 'cancelled') {
          return NextResponse.json({
            result: {
              transaction: transaction.id,
              cancel_time: Date.now(),
              state: -1
            },
            id: body.id
          } as PaymeResponse);
        }

        // Cancel transaction
        const cancelTime = Date.now();
        const { error: updateError } = await supabase
          .from('payment_transactions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            error_message: `Cancelled by Payme. Reason: ${reason}`
          })
          .eq('id', transaction.id);

        if (updateError) {
          return createPaymeError(-31008, 'Failed to cancel transaction', body.id);
        }

        return NextResponse.json({
          result: {
            transaction: transaction.id,
            cancel_time: cancelTime,
            state: -1
          },
          id: body.id
        } as PaymeResponse);
      }

      case 'CheckTransaction': {
        const transactionId = body.params.id;

        if (!transactionId) {
          return createPaymeError(-31003, 'Transaction not found', body.id);
        }

        // Get transaction
        const { data: transaction, error } = await supabase
          .from('payment_transactions')
          .select('id, status, payme_time, completed_at, cancelled_at')
          .eq('payme_transaction_id', transactionId)
          .single();

        if (error || !transaction) {
          return createPaymeError(-31003, 'Transaction not found', body.id);
        }

        let state = 1; // processing
        if (transaction.status === 'completed') state = 2;
        if (transaction.status === 'cancelled') state = -1;

        return NextResponse.json({
          result: {
            create_time: transaction.payme_time || Date.now(),
            perform_time: transaction.completed_at ? new Date(transaction.completed_at).getTime() : 0,
            cancel_time: transaction.cancelled_at ? new Date(transaction.cancelled_at).getTime() : 0,
            transaction: transaction.id,
            state,
            reason: null
          },
          id: body.id
        } as PaymeResponse);
      }

      default:
        return createPaymeError(-32601, 'Method not found', body.id);
    }
  } catch (error) {
    console.error('Payme webhook error:', error);
    return createPaymeError(-32400, 'Internal server error', 0);
  }
}