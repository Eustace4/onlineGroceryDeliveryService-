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

        $existingAddress = $user->addresses()->where([
            ['street', $request->address['street']],
            ['city', $request->address['city']],
            ['state', $request->address['state']],
            ['postal_code', $request->address['postal_code']],
            ['country', $request->address['country']],
        ])->first();

        if ($existingAddress) {
            $address = $existingAddress;
        } else {
            $address = $user->addresses()->create($request->address);
        }

        // ✅ Create and save address for this order
        //$address = $user->addresses()->create($request->address);

        $firstProduct = Product::find($request->items[0]['product_id']);
        $businessId = $firstProduct->business_id;
        
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
            'business_id' => $businessId,
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
        $orders = Order::with('items.product', 'address', 'business')->where('user_id', Auth::id())->get();
        return response()->json($orders);
    }

    // Optional: Admin view for all orders
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
            $orders = Order::with('items.product', 'address', 'user')->get();
        } elseif ($user->role === 'vendor') {
            // Get orders only for the businesses owned by this vendor
            $orders = Order::with('items.product', 'address', 'user')
                ->whereHas('business', function($query) use ($user) {
                    $query->where('vendor_id', $user->id);
                })
                ->get();
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($orders);
    }


   public function assignRider(Request $request, Order $order)
    {
        $request->validate([
            'rider_id' => 'required|exists:users,id',
        ]);

        $user = Auth::user();

        // Load the business relationship if not already loaded
        $order->load('business');
        
        // Only admin or the business owner can assign a rider
        if ($user->role !== 'admin' && $user->id !== $order->business->vendor_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Ensure the selected user is a rider
        $rider = \App\Models\User::where('id', $request->rider_id)->where('role', 'rider')->first();

        if (!$rider) {
            return response()->json(['message' => 'Invalid rider ID'], 404);
        }

        // Assign the rider
        $order->rider_id = $rider->id;
        $order->save();

        return response()->json(['message' => 'Rider assigned successfully', 'order' => $order]);
    }

}
