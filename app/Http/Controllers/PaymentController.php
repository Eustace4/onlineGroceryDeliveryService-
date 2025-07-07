<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;


class PaymentController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'method' => 'required|string|in:card,bank_transfer,cash',
        ]);

        $order = Order::where('id', $request->order_id)
                      ->where('user_id', Auth::id())
                      ->firstOrFail();

        // Prevent duplicate payment
        if ($order->payment) {
            return response()->json(['message' => 'Payment already exists'], 409);
        }

        $payment = Payment::create([
            'order_id' => $order->id,
            'method' => $request->method,
            'status' => 'paid', // Simulated for testing
            'paid_at' => now(),
        ]);

        // If payment method is not cash, update order status to 'processing'
        if ($request->method !== 'cash') {
            $order->update(['status' => 'processing']);
        }

        return response()->json([
            'message' => 'Payment recorded successfully',
            'payment' => $payment
        ], 201);
    }

    public function show($id)
    {
        $payment = Payment::with('order')->findOrFail($id);

        return response()->json($payment);
    }
}
