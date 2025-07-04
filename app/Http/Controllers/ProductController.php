<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    // View all products (public)
    public function index()
    {
        return Product::with('category', 'business')->get();
    }

    // View one product by ID (public)
    public function show($id)
    {
        return Product::with('category', 'business')->findOrFail($id);
    }

    // Create product (vendor/admin only)
    public function store(Request $request)
    {
        if (!in_array(Auth::user()->role, ['admin', 'vendor'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required',
            'description' => 'nullable',
            'price' => 'required|numeric',
            'stock' => 'required|integer',
            'category_id' => 'required|exists:categories,id',
            'business_id' => 'required|exists:businesses,id',
            'image' => 'nullable|image|max:2048',
        ]);

        // Handle image upload
        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('product_images', 'public');
        }

        $product = Product::create([
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'stock' => $request->stock,
            'category_id' => $request->category_id,
            'business_id' => $request->business_id,
            'image' => $imagePath,
        ]);

        return response()->json(['message' => 'Product created', 'product' => $product], 201);
    }

    // Update product
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $product = Product::findOrFail($id);

        // ✅ Role-based ownership check
        if (
            $user->role === 'vendor' &&
            $user->business->id !== $product->business_id
        ) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'sometimes|numeric',
            'stock'       => 'sometimes|integer',
            'category_id' => 'sometimes|exists:categories,id',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Update image if provided
        if ($request->hasFile('image')) {
            // Delete old image
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }

            $product->image = $request->file('image')->store('products', 'public');
        }

        $product->update($request->except('image'));

        return response()->json(['message' => 'Product updated', 'product' => $product]);
    }

    // Delete product
    public function destroy($id)
    {
        $user = Auth::user();
        $product = Product::findOrFail($id);

        if (
            $user->role === 'vendor' &&
            $user->business->id !== $product->business_id
        ) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Delete image if exists
        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted']);
    }
}
