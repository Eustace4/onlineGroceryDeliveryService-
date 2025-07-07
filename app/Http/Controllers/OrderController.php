<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    // Place a new order
   public function store(Request $request)
    {
        $request->validate([
            'address.street' => 'required|string',
            'address.city' => 'required|string',
            'address.state' => 'required|string',
            'address.postal_code' => 'required|string',
            'address.country' => 'required|string',

            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $user = Auth::user();

        // ✅ Create and save address for this order
        $address = $user->addresses()->create($request->address);

        $total = 0;

        // ✅ Validate products and calculate total
        foreach ($request->items as $item) {
            $product = Product::findOrFail($item['product_id']);

            if ($product->stock < $item['quantity']) {
                return response()->json(['message' => "Not enough stock for {$product->name}"], 422);
            }

            $total += $product->price * $item['quantity'];
        }

        // ✅ Save order
        $order = Order::create([
            'user_id' => $user->id,
            'address_id' => $address->id,
            'total' => $total,
            'status' => 'pending',
        ]);

        // ✅ Save order items and reduce stock
        foreach ($request->items as $item) {
            $product = Product::findOrFail($item['product_id']);

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'quantity' => $item['quantity'],
                'price' => $product->price,
            ]);

            $product->decrement('stock', $item['quantity']);
        }

        return response()->json([
            'message' => 'Order placed successfully',
            'order' => $order->load('items.product', 'address'),
        ], 201);
    }


    // Get orders for authenticated user
    public function myOrders()
    {
        $orders = Order::with('items.product', 'address')->where('user_id', Auth::id())->get();
        return response()->json($orders);
    }

    // Optional: Admin view for all orders
    public function index()
    {
        $user = Auth::user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $orders = Order::with('items.product', 'address', 'user')->get();
        return response()->json($orders);
    }
}
